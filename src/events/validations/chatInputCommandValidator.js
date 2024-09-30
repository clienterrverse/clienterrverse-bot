/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalCommands from '../../utils/getLocalCommands.js';

/**
 * A simple LRU Cache implementation.
 *
 * @class LRUCache
 * @param {number} capacity - The maximum number of items the cache can hold.
 */
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Retrieves a value from the cache by its key.
   *
   * @param {string} key - The key of the value to retrieve.
   * @returns {(any|undefined)} The value associated with the key or undefined if not found.
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Sets a value in the cache by its key.
   *
   * @param {string} key - The key of the value to set.
   * @param {any} value - The value to set.
   */
  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

const cache = new LRUCache(100); // Adjust capacity as needed
const cooldowns = new Collection();
const commandMap = new Map();

/**
 * Sends an embed reply to an interaction.
 *
 * @param {Interaction} interaction - The interaction to reply to.
 * @param {string} color - The color of the embed.
 * @param {string} description - The description of the embed.
 * @param {boolean} [ephemeral=true] - Whether the reply should be ephemeral.
 */
const sendEmbedReply = async (
  interaction,
  color,
  description,
  ephemeral = true
) => {
  try {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral });
  } catch (err) {}
};

/**
 * Retrieves data from the cache or fetches it if not cached.
 *
 * @param {string} key - The key of the data to retrieve.
 * @param {Function} fetchFunction - The function to fetch the data if not cached.
 * @returns {Promise<any>} A promise that resolves to the data.
 */
const getCachedData = async (key, fetchFunction) => {
  const cachedItem = cache.get(key);
  if (cachedItem) return cachedItem;

  const data = await fetchFunction();
  cache.set(key, data);
  return data;
};

/**
 * Retrieves cached local commands.
 *
 * @returns {Promise<any>} A promise that resolves to the cached local commands.
 */
const getCachedLocalCommands = () =>
  getCachedData('localCommands', getLocalCommands);

/**
 * Initializes the command map with local commands.
 */
const initializeCommandMap = async () => {
  const localCommands = await getCachedLocalCommands();
  localCommands.forEach((cmd) => {
    commandMap.set(cmd.data.name, cmd);
    if (cmd.aliases) {
      cmd.aliases.forEach((alias) => commandMap.set(alias, cmd));
    }
  });
};

/**
 * Applies a cooldown to a command for a user.
 *
 * @param {Interaction} interaction - The interaction to apply the cooldown for.
 * @param {string} commandName - The name of the command.
 * @param {number} cooldownAmount - The amount of time in milliseconds for the cooldown.
 * @returns {{active: boolean, timeLeft: string}} An object indicating if the cooldown is active and the time left.
 */
const applyCooldown = (interaction, commandName, cooldownAmount) => {
  if (isNaN(cooldownAmount) || cooldownAmount <= 0) {
    throw new Error('Invalid cooldown amount');
  }

  const userCooldowns = cooldowns.get(commandName) || new Collection();
  const now = Date.now();
  const userId = `${interaction.user.id}-${interaction.guild ? interaction.guild.id : 'DM'}`;

  if (userCooldowns.has(userId)) {
    const expirationTime = userCooldowns.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      return {
        active: true,
        timeLeft: ((expirationTime - now) / 1000).toFixed(1),
      };
    }
  }

  userCooldowns.set(userId, now);
  setTimeout(() => userCooldowns.delete(userId), cooldownAmount);
  cooldowns.set(commandName, userCooldowns);
  return { active: false };
};

/**
 * Checks if a member has the required permissions.
 *
 * @param {Interaction} interaction - The interaction to check permissions for.
 * @param {Array<string>} permissions - The required permissions.
 * @param {'user'|'bot'} type - The type of member to check permissions for.
 * @returns {boolean} True if the member has all the required permissions, false otherwise.
 */
const checkPermissions = (interaction, permissions, type) => {
  const member =
    type === 'user' ? interaction.member : interaction.guild.members.me;
  return permissions.every((permission) => member.permissions.has(permission));
};

/**
 * The main function to validate and execute chat input commands.
 *
 * @param {Client} client - The Discord client.
 * @param {Function} errorHandler - The error handler function.
 * @param {Interaction} interaction - The interaction to validate and execute.
 */
export default async (client, errorHandler, interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
    return;

  if (commandMap.size === 0) {
    await initializeCommandMap(); // Initialize command map if it's empty
  }

  const { developersId, testServerId, maintenance } = config;

  try {
    const commandObject = commandMap.get(interaction.commandName);

    if (!commandObject) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        'Command not found.'
      );
    }

    if (interaction.isAutocomplete()) {
      return await commandObject.autocomplete(client, interaction);
    }

    if (maintenance && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        'Bot is currently in maintenance mode. Please try again later.'
      );
    }

    const cooldown = applyCooldown(
      interaction,
      commandObject.data.name,
      (commandObject.cooldown || 3) * 1000
    );
    if (cooldown.active) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        mConfig.commandCooldown.replace('{time}', cooldown.timeLeft)
      );
    }

    if (commandObject.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        mConfig.commandDevOnly
      );
    }

    if (commandObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        mConfig.commandTestMode
      );
    }

    if (commandObject.nsfwMode && !interaction.channel.nsfw) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.nsfw);
    }

    if (
      commandObject.userPermissions?.length &&
      !checkPermissions(interaction, commandObject.userPermissions, 'user')
    ) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        mConfig.userNoPermissions
      );
    }

    if (
      commandObject.botPermissions?.length &&
      !checkPermissions(interaction, commandObject.botPermissions, 'bot')
    ) {
      return sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        mConfig.botNoPermissions
      );
    }

    try {
      await commandObject.run(client, interaction);
    } catch (err) {
      await errorHandler.handleError(err, {
        type: 'commandError',
        commandName: interaction.commandName,
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
      });

      sendEmbedReply(
        interaction,
        mConfig.embedColorError,
        'An error occurred while executing the command.'
      );
    }

    console.log(
      `Command executed: ${interaction.commandName} by ${interaction.user.tag}`
        .green
    );
  } catch (err) {
    await errorHandler.handleError(err, {
      type: 'commandError',
      commandName: interaction.commandName,
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
    });

    sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      'An error occurred while processing the command.'
    );
  }
};
