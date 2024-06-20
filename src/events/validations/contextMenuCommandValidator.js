import 'colors';
import { EmbedBuilder } from 'discord.js';
import config from '../../config/config.json' assert { type: 'json' };
import mConfig from '../../config/messageConfig.json' assert { type: 'json' };
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

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
    if (menuObject.devOnly) {
      if (!developersId.includes(interaction.member.id)) {
        const rEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorError)
          .setDescription(mConfig.commandDevOnly);
        await interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    // Test Server Only Check
    if (menuObject.testMode) {
      if (interaction.guild.id !== testServerId) {
        const rEmbed = new EmbedBuilder()
          .setColor(mConfig.embedColorError)
          .setDescription(mConfig.commandTestMode);
        await interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    // User Permissions Check
    if (menuObject.userPermissions?.length) {
      for (const permission of menuObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          const rEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setDescription(mConfig.userNoPermissions);
          await interaction.reply({ embeds: [rEmbed], ephemeral: true });
          return;
        }
      }
    }

    // Bot Permissions Check
    if (menuObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of menuObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          const rEmbed = new EmbedBuilder()
            .setColor(mConfig.embedColorError)
            .setDescription(mConfig.botNoPermissions);
          await interaction.reply({ embeds: [rEmbed], ephemeral: true });
          return;
        }
      }
    }

    // Execute the context menu command
    await menuObject.run(client, interaction);

  } catch (err) {
    console.error(`An error occurred while validating context menu commands! ${err}`.red);
    const rEmbed = new EmbedBuilder()
      .setColor(mConfig.embedColorError)
      .setDescription(`An unexpected error occurred. Please try again later or contact support if the problem persists.`);
    await interaction.reply({ embeds: [rEmbed], ephemeral: true });
  }
};
