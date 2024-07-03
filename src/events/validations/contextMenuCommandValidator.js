import 'colors';
import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

const sendEmbedReply = async (interaction, color, description, ephemeral = true) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
};

export default async (client, interaction) => {
  if (!interaction.isContextMenuCommand()) return;

  const localContextMenus = await getLocalContextMenus();
  const { developersId, testServerId } = config;

  try {
    const menuObject = localContextMenus.find(
      (cmd) => cmd.data.name === interaction.commandName
    );
    if (!menuObject) return;

    // Developer Only Check
    if (menuObject.devOnly && !developersId.includes(interaction.member.id)) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandDevOnly);
    }

    // Test Server Only Check
    if (menuObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandTestMode);
    }

    // User Permissions Check
    if (menuObject.userPermissions?.length) {
      for (const permission of menuObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.userNoPermissions);
        }
      }
    }

    // Bot Permissions Check
    if (menuObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of menuObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.botNoPermissions);
        }
      }
    }

    // Execute the context menu command
    await menuObject.run(client, interaction);
    console.log(`Context menu command executed: ${interaction.commandName} by ${interaction.member.user.tag}`.green);

  } catch (err) {
    console.error(`An error occurred while processing context menu command: ${interaction.commandName}. Error: ${err.message}`.red);
    await sendEmbedReply(interaction, mConfig.embedColorError, `An unexpected error occurred. Please try again later or contact support if the problem persists.`);
  }
};
