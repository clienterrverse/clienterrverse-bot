import { Client, EmbedBuilder } from 'discord.js';
import mconfig from '../config/messageConfig.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

const defaultMessages = {
  errors: {
    notOwner:
      "You don't have permission to transfer ownership of this channel.",
    notInVoiceChannel: 'The selected member is not in the voice channel.',
    generic:
      'An error occurred while processing your request. Please try again later.',
  },
  success: {
    ownerUpdated: 'Owner updated successfully!',
  },
  embeds: {
    ownershipTransferred: {
      title: 'Channel Ownership Transferred',
      description: (newOwner) =>
        `The ownership of this channel has been transferred to ${newOwner}.`,
      color: 'Green',
    },
  },
};

export default {
  customId: 'owner_select',
  botPermissions: [],

  /**
   * @param {Client} client
   * @param {import('discord.js').Interaction} interaction
   */
  run: async (client, interaction) => {
    try {
      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        !checkResult.isOwner
      ) {
        return interaction.reply({
          content:
            checkResult.message ||
            (mconfig.errors?.notOwner ?? defaultMessages.errors.notOwner),
          ephemeral: true,
        });
      }

      const newOwnerId = interaction.values[0];
      const newOwner = await interaction.guild.members.fetch(newOwnerId);

      if (
        !newOwner.voice.channel ||
        newOwner.voice.channel.id !== checkResult.channel.id
      ) {
        const embed = new EmbedBuilder()
          .setTitle('Failed to Transfer Ownership')
          .setDescription(
            mconfig.errors?.notInVoiceChannel ??
              defaultMessages.errors.notInVoiceChannel
          )
          .setColor('Red');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await JoinToSystemChannel.findOneAndUpdate(
        { channelId: checkResult.channel.id },
        { ownerId: newOwnerId }
      );

      const embedConfig =
        mconfig.embeds?.ownershipTransferred ??
        defaultMessages.embeds.ownershipTransferred;

      const embed = new EmbedBuilder()
        .setTitle(embedConfig.title)
        .setDescription(
          typeof embedConfig.description === 'function'
            ? embedConfig.description(newOwner.user.username)
            : `The ownership of this channel has been transferred to ${newOwner.user.username}.`
        )
        .setColor(embedConfig.color)
        .setTimestamp();

      await interaction.update({
        content:
          mconfig.success?.ownerUpdated ?? defaultMessages.success.ownerUpdated,
        embeds: [embed],
        components: [],
      });
    } catch (error) {
      console.error('Error in owner_select menu:', error);
      await interaction.reply({
        content: mconfig.errors?.generic ?? defaultMessages.errors.generic,
        ephemeral: true,
      });
    }
  },
};
