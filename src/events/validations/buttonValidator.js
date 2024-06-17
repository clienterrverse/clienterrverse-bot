import 'colors';
import { EmbedBuilder } from 'discord.js';
import  config from '../../config/config.json' assert { type: 'json' };
import mConfig from '../../config/messageConfig.json' assert { type: 'json' };
import getButtons from '../../utils/getButtons.js';

export default async (client, interaction) => {
  const { developersId, testServerId } = config;
  if (!interaction.isButton()) return;
  const buttons = await getButtons();

  try {
    const buttonObject = buttons.find(
      (btn) => btn.customId === interaction.customId
    );
    if (!buttonObject) return;

    if (buttonObject.devOnly) {
      if (!developersId.includes(interaction.member.id)) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandDevOnly}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (buttonObject.testMode) {
      if (interaction.guild.id !== testServerId) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandTestMode}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (buttonObject.userPermissions?.length) {
      for (const permission of buttonObject.userPermissions) {
        if (interaction.member.permissions.has(permission)) {
          continue;
        }
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.userNoPermissions}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (buttonObject.botPermissions?.length) {
      for (const permission of buttonObject.botPermissions) {
        const bot = interaction.guild.members.me;
        if (bot.permissions.has(permission)) {
          continue;
        }
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.botNoPermissions}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (interaction.message.interaction) {
      if (interaction.message.interaction.user.id !== interaction.user.id) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.cannotUseButton}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }
  
    await buttonObject.run(client, interaction);
  } catch (err) {
    console.log(`An error occurred! ${err}`.red);
  }
};