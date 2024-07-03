import 'colors';
import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getButtons from '../../utils/getButtons.js';

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const { developersId, testServerId } = config;
  const buttons = await getButtons();

  try {
    const buttonObject = buttons.find(btn => btn.customId === interaction.customId);
    if (!buttonObject) return;

    // Check for developer-only restriction
    if (buttonObject.devOnly && !developersId.includes(interaction.member.id)) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandDevOnly, true);
    }

    // Check for test mode restriction
    if (buttonObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandTestMode, true);
    }

    // Check user permissions
    if (buttonObject.userPermissions?.length) {
      for (const permission of buttonObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.userNoPermissions, true);
        }
      }
    }

    // Check bot permissions
    if (buttonObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of buttonObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.botNoPermissions, true);
        }
      }
    }

    // Check if the interaction user matches the original message interaction user
    if (interaction.message.interaction && interaction.message.interaction.user.id !== interaction.user.id) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.cannotUseButton, true);
    }

    // Run the button action
    await buttonObject.run(client, interaction);
  } catch (err) {
    console.error(`An error occurred while handling button interaction: ${err.message}`.red);
  }
};

// Helper function to send an embed reply
const sendEmbedReply = (interaction, color, description, ephemeral = false) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  interaction.reply({ embeds: [embed], ephemeral });
};
