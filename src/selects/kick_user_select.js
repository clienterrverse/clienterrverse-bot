import { Client, EmbedBuilder } from 'discord.js';
import mconfig from '../config/messageConfig.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

const defaultMessages = {
  errors: {
    notOwner: "You don't have permission to kick users from this channel.",
    notInVoiceChannel: 'The selected member is not in the voice channel.',
    cannotKickOwner: 'You cannot kick the channel owner.',
    generic:
      'An error occurred while processing your request. Please try again later.',
  },
  success: {
    userKicked: 'The user has been kicked from the voice channel!',
  },
  embeds: {
    userKicked: {
      title: 'User Kicked from Voice Channel',
      description: (kickedUser) =>
        `${kickedUser} has been kicked from the voice channel.`,
      color: 'Orange',
    },
  },
};

export default {
  customId: 'kick_user_select',

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

      const kickedUserId = interaction.values[0];
      const kickedMember = await interaction.guild.members.fetch(kickedUserId);

      if (
        !kickedMember.voice.channel ||
        kickedMember.voice.channel.id !== checkResult.channel.id
      ) {
        const embed = new EmbedBuilder()
          .setTitle('Failed to Kick User')
          .setDescription(
            mconfig.errors?.notInVoiceChannel ??
              defaultMessages.errors.notInVoiceChannel
          )
          .setColor('Red');

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const channelDoc = await JoinToSystemChannel.findOne({
        channelId: checkResult.channel.id,
      });

      if (kickedUserId === channelDoc.ownerId) {
        return interaction.reply({
          content:
            mconfig.errors?.cannotKickOwner ??
            defaultMessages.errors.cannotKickOwner,
          ephemeral: true,
        });
      }

      // Kick the user from the voice channel
      await kickedMember.voice.disconnect();

      // Remove the kicked user from the allowedUsers array if present
      await JoinToSystemChannel.findOneAndUpdate(
        { channelId: checkResult.channel.id },
        { $pull: { allowedUsers: kickedUserId } }
      );

      const embedConfig =
        mconfig.embeds?.userKicked ?? defaultMessages.embeds.userKicked;

      const embed = new EmbedBuilder()
        .setTitle(embedConfig.title)
        .setDescription(
          typeof embedConfig.description === 'function'
            ? embedConfig.description(kickedMember.user.username)
            : `${kickedMember.user.username} has been kicked from the voice channel.`
        )
        .setColor(embedConfig.color)
        .setTimestamp();

      await interaction.update({
        content:
          mconfig.success?.userKicked ?? defaultMessages.success.userKicked,
        embeds: [embed],
        components: [],
      });
    } catch (error) {
      console.error('Error in kick_user_select menu:', error);
      await interaction.reply({
        content: mconfig.errors?.generic ?? defaultMessages.errors.generic,
        ephemeral: true,
      });
    }
  },
};
