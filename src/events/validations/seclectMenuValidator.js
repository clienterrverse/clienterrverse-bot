import 'colors';
import { Client, EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getSelects from '../../utils/getSelects.js';

const sendEmbedReply = async (interaction, color, description, ephemeral = true) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
};

export default async (client, interaction) => {
  if (!interaction.isAnySelectMenu()) return;

  const selects = await getSelects();
  const { developersId, testServerId } = config;

  try {
    const selectObject = selects.find(
      (select) => select.customId === interaction.customId
    );
    if (!selectObject) return;

    // Developer Only Check
    if (selectObject.devOnly && !developersId.includes(interaction.member.id)) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandDevOnly);
    }

    // Test Server Only Check
    if (selectObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandTestMode);
    }

    // User Permissions Check
    if (selectObject.userPermissions?.length) {
      for (const permission of selectObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.userNoPermissions);
        }
      }
    }

    // Bot Permissions Check
    if (selectObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of selectObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.botNoPermissions);
        }
      }
    }

    // Interaction User Check
    if (interaction.message.interaction && interaction.message.interaction.user.id !== interaction.user.id) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.cannotUseSelect);
    }

    // Execute the select menu command
    await selectObject.run(client, interaction);
    console.log(`Select menu executed: ${interaction.customId} by ${interaction.member.user.tag}`.green);

  } catch (err) {
    console.error(`An error occurred while processing select menu: ${interaction.customId}. Error: ${err.message}`.red);
    await sendEmbedReply(interaction, mConfig.embedColorError, `An unexpected error occurred. Please try again later or contact support if the problem persists.`);
  }
};
