import 'colors';
import { EmbedBuilder } from 'discord.js';
import config from '../../config/config.json' assert { type: 'json' };
import mConfig from '../../config/messageConfig.json' assert { type: 'json' };
import getModals from '../../utils/getModals.js';

export default async (client, interaction) => {
  if (!interaction.isModalSubmit()) return;
  const modals = getModals();
  const { developersId, testServerId } = config;


  try {
    const modalObject = modals.find(
      (modal) => modal.customId === interaction.customId
    );
    if (!modalObject) return;

    if (modalObject.devOnly) {
      if (!developersId.includes(interaction.member.id)) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandDevOnly}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (modalObject.testMode) {
      if (interaction.guild.id !== testServerId) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandTestMode}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    if (modalObject.userPermissions?.length) {
      for (const permission of modalObject.userPermissions) {
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

    if (modalObject.botPermissions?.length) {
      for (const permission of modalObject.botPermissions) {
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

    await modalObject.run(client, interaction);
  } catch (err) {
    console.log(
      `An error occurred while validating modal commands! ${err}`.red
    );
  }
};
