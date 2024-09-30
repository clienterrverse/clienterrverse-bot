/** @format */
import 'colors';
import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getButtons from '../../utils/getButtons.js';

/**
 * Class for LRUCache
 */
class LRUCache {
  /**
   * Constructor for LRUCache
   * @param {number} capacity - The capacity of the LRUCache
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  /**
   * Get method for LRUCache
   * @param {string} key - The key to get from the cache
   * @returns {any} - The value associated with the key
   */
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const item = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, item);
    return item;
  }

  /**
   * Set method for LRUCache
   * @param {string} key - The key to set in the cache
   * @param {any} value - The value to associate with the key
   */
  set(key, value) {
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }
}

const buttons = new Map();
const cooldowns = new Map();
const buttonCache = new LRUCache(100); // Adjust capacity as needed
let buttonsLoaded = false;

/**
 * Function to send an embed reply
 * @param {object} interaction - The interaction object
 * @param {string} color - The color of the embed
 * @param {string} description - The description of the embed
 * @param {boolean} ephemeral - Whether the reply should be ephemeral
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
 * Function to check permissions
 * @param {object} member - The member object
 * @param {string[]} permissions - The permissions to check
 * @returns {boolean} - Whether the member has all the permissions
 */
const checkPermissions = (member, permissions) =>
  permissions.every((permission) =>
    member.permissions.has(PermissionsBitField.Flags[permission])
  );

/**
 * Function to load buttons
 * @param {object} errorHandler - The error handler object
 * @param {number} retryCount - The number of times to retry loading buttons
 */
const loadButtons = async (errorHandler, retryCount = 0) => {
  try {
    const buttonFiles = await getButtons();
    for (const button of buttonFiles) {
      button.compiledChecks = {
        userPermissions: button.userPermissions
          ? (interaction) =>
              checkPermissions(interaction.member, button.userPermissions)
          : () => true,
        botPermissions: button.botPermissions
          ? (interaction) =>
              checkPermissions(
                interaction.guild.members.me,
                button.botPermissions
              )
          : () => true,
      };
      buttons.set(button.customId, button);
    }
    console.log(`Loaded ${buttons.size} buttons`.green);
    buttonsLoaded = true;
  } catch (error) {
    errorHandler.handleError(error, { type: 'buttonLoad' });
    console.error('Error loading buttons:'.red, error);

    if (retryCount < 3) {
      console.log(`Retrying button load... (Attempt ${retryCount + 1})`.yellow);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await loadButtons(errorHandler, retryCount + 1);
    } else {
      console.error('Failed to load buttons after 3 attempts'.red);
    }
  }
};

/**
 * Function to handle a button interaction
 * @param {object} client - The client object
 * @param {object} errorHandler - The error handler object
 * @param {object} interaction - The interaction object
 */
const handleButton = async (client, errorHandler, interaction) => {
  const { customId } = interaction;
  let button = buttonCache.get(customId);
  if (!button) {
    button = buttons.get(customId);
    if (button) buttonCache.set(customId, button);
  }

  if (!button) return;
  const { developersId, testServerId } = config;

  if (button.devOnly && !developersId.includes(interaction.user.id)) {
    return sendEmbedReply(interaction, 'error', mConfig.commandDevOnly, true);
  }

  if (button.testMode && interaction.guild.id !== testServerId) {
    return sendEmbedReply(interaction, 'error', mConfig.commandTestMode, true);
  }

  if (!button.compiledChecks.userPermissions(interaction)) {
    return sendEmbedReply(
      interaction,
      'error',
      mConfig.userNoPermissions,
      true
    );
  }

  if (!button.compiledChecks.botPermissions(interaction)) {
    return sendEmbedReply(interaction, 'error', mConfig.botNoPermissions, true);
  }

  if (
    interaction.message.interaction &&
    interaction.message.interaction.user.id !== interaction.user.id
  ) {
    return sendEmbedReply(interaction, 'error', mConfig.cannotUseButton, true);
  }

  if (button.cooldown) {
    const cooldownKey = `${interaction.user.id}-${customId}`;
    const cooldownTime = cooldowns.get(cooldownKey);
    if (cooldownTime && Date.now() < cooldownTime) {
      const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
      return sendEmbedReply(
        interaction,
        'error',
        `Please wait ${remainingTime} seconds before using this button again.`,
        true
      );
    }
    cooldowns.set(cooldownKey, Date.now() + button.cooldown * 1000);
  }

  try {
    console.log(
      `Executing button ${customId} for user ${interaction.user.tag}`.cyan
    );
    await button.run(client, interaction);
  } catch (error) {
    console.error(`Error executing button ${customId}:`.red, error);
    await errorHandler.handleError(error, {
      type: 'buttonError',
      buttonId: customId,
      userId: interaction.user.id,
      guildId: interaction.guild.id,
    });
    sendEmbedReply(
      interaction,
      'error',
      'There was an error while executing this button!',
      true
    );
  }
};

/**
 * Default export function for button validation
 * @param {object} client - The client object
 * @param {object} errorHandler - The error handler object
 * @param {object} interaction - The interaction object
 */
export default async (client, errorHandler, interaction) => {
  if (!interaction.isButton()) return;

  if (!buttonsLoaded) {
    await loadButtons(errorHandler);
  }

  await handleButton(client, errorHandler, interaction);
};
