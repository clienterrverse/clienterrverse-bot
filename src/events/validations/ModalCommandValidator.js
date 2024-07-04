import 'colors';
import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getModals from '../../utils/getModals.js';

const sendEmbedReply = async (interaction, color, description, ephemeral = true) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
};

export default async (client, interaction) => {
  if (!interaction.isModalSubmit()) return;

  const modals = await getModals();
  const { developersId, testServerId } = config;

  try {
    const modalObject = modals.find(
      (modal) => modal.customId === interaction.customId
    );
    if (!modalObject) return;

    // Developer Only Check
    if (modalObject.devOnly && !developersId.includes(interaction.member.id)) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandDevOnly);
    }

    // Test Server Only Check
    if (modalObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandTestMode);
    }

    // User Permissions Check
    if (modalObject.userPermissions?.length) {
      for (const permission of modalObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.userNoPermissions);
        }
      }
    }

    // Bot Permissions Check
    if (modalObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of modalObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.botNoPermissions);
        }
      }
    }

    // Execute the modal command
    await modalObject.run(client, interaction);
    console.log(`Modal command executed: ${interaction.customId} by ${interaction.member.user.tag}`.green);

  } catch (err) {
    console.error(`An error occurred while processing modal command: ${interaction.customId}. Error: ${err.message}`.red);
    await sendEmbedReply(interaction, mConfig.embedColorError, `An unexpected error occurred. Please try again later or contact support if the problem persists.`);
  }
};
