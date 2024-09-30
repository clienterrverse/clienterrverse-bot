/** @format */

import 'colors';
import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

/**
 * A simple Least Recently Used (LRU) cache implementation.
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
   * Retrieves a value from the cache by its key. If the key is found, it is moved to the front of the cache.
   *
   * @param {string} key - The key to retrieve the value for.
   * @returns {(undefined|*)} The value associated with the key or undefined if not found.
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Sets a value in the cache. If the cache is full, the least recently used item is removed.
   *
   * @param {string} key - The key to associate with the value.
   * @param {*} value - The value to store in the cache.
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

const contextMenus = new LRUCache(100); // Adjust capacity as needed

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
 * Checks if a member has a set of permissions.
 *
 * @param {Interaction} interaction - The interaction to check permissions for.
 * @param {Array<string>} permissions - The permissions to check.
 * @param {'user'|'bot'} type - The type of member to check permissions for.
 * @returns {boolean} True if the member has all the specified permissions, false otherwise.
 */
const checkPermissions = (interaction, permissions, type) => {
  const member =
    type === 'user' ? interaction.member : interaction.guild.members.me;
  return permissions.every((permission) => member.permissions.has(permission));
};

/**
 * Loads context menus from local files.
 */
const loadContextMenus = async () => {
  try {
    const menuFiles = await getLocalContextMenus();
    for (const menu of menuFiles) {
      contextMenus.set(menu.data.name, menu);
    }
    console.log(
      `Loaded ${contextMenus.cache.size} context menu commands`.green
    );
  } catch (error) {
    console.error('Error loading context menus:'.red, error);
  }
};

/**
 * Handles a context menu interaction.
 *
 * @param {Client} client - The Discord client.
 * @param {Function} errorHandler - A function to handle errors.
 * @param {Interaction} interaction - The interaction to handle.
 */
const handleContextMenu = async (client, errorHandler, interaction) => {
  const { commandName } = interaction;
  const menuObject = contextMenus.get(commandName);

  if (!menuObject) return;

  const { developersId, testServerId } = config;

  if (menuObject.devOnly && !developersId.includes(interaction.user.id)) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.commandDevOnly
    );
  }

  if (menuObject.testMode && interaction.guild.id !== testServerId) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.commandTestMode
    );
  }

  if (
    menuObject.userPermissions?.length &&
    !checkPermissions(interaction, menuObject.userPermissions, 'user')
  ) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.userNoPermissions
    );
  }

  if (
    menuObject.botPermissions?.length &&
    !checkPermissions(interaction, menuObject.botPermissions, 'bot')
  ) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.botNoPermissions
    );
  }

  try {
    await menuObject.run(client, interaction);
    console.log(
      `Context menu command executed: ${commandName} by ${interaction.user.tag}`
        .green
    );
  } catch (error) {
    console.error(
      `Error executing context menu command ${commandName}:`.red,
      error
    );

    await errorHandler.handleError(error, {
      type: 'contextMenuError',
      commandName: commandName,
      userId: interaction.user.id,
      guildId: interaction.guild?.id,
    });

    sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      'There was an error while executing this context menu command!'
    );
  }
};

// Call this function during bot initialization
await loadContextMenus();

/**
 * The main function to handle context menu commands.
 *
 * @param {Client} client - The Discord client.
 * @param {Function} errorHandler - A function to handle errors.
 * @param {Interaction} interaction - The interaction to handle.
 */
export default async (client, errorHandler, interaction) => {
  if (!interaction.isContextMenuCommand()) return;

  await handleContextMenu(client, errorHandler, interaction);
};
