/** @format */
import { Client, EmbedBuilder } from 'discord.js';
import mconfig from '../config/messageConfig.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

const defaultMessages = {
   errors: {
      notOwner:
         "You don't have permission to manage talk access in this channel.",
      notInVoiceChannel: 'The selected member is not in the voice channel.',
      cannotManageOwner: 'You cannot manage talk access for the channel owner.',
      generic:
         'An error occurred while processing your request. Please try again later.',
   },
   success: {
      userMuted: 'The user has been muted in the voice channel!',
      userUnmuted: 'The user has been unmuted in the voice channel!',
   },
   embeds: {
      userMuted: {
         title: 'User Muted in Voice Channel',
         description: (mutedUser) =>
            `${mutedUser} has been muted in the voice channel.`,
         color: 'Orange',
      },
      userUnmuted: {
         title: 'User Unmuted in Voice Channel',
         description: (unmutedUser) =>
            `${unmutedUser} has been unmuted in the voice channel.`,
         color: 'Green',
      },
   },
};

export default {
   customId: 'manage_talk_select',

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

         const selectedUserId = interaction.values[0];
         const selectedMember =
            await interaction.guild.members.fetch(selectedUserId);

         if (
            !selectedMember.voice.channel ||
            selectedMember.voice.channel.id !== checkResult.channel.id
         ) {
            const embed = new EmbedBuilder()
               .setTitle('Failed to Manage Talk Access')
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

         // Toggle mute/unmute status
         const newMuteStatus = !selectedMember.voice.serverMute;
         await selectedMember.voice.setMute(newMuteStatus);

         const embedConfig = newMuteStatus
            ? (mconfig.embeds?.userMuted ?? defaultMessages.embeds.userMuted)
            : (mconfig.embeds?.userUnmuted ??
              defaultMessages.embeds.userUnmuted);

         const embed = new EmbedBuilder()
            .setTitle(embedConfig.title)
            .setDescription(
               typeof embedConfig.description === 'function'
                  ? embedConfig.description(selectedMember.user.username)
                  : newMuteStatus
                    ? `${selectedMember.user.username} has been muted in the voice channel.`
                    : `${selectedMember.user.username} has been unmuted in the voice channel.`
            )
            .setColor(embedConfig.color)
            .setTimestamp();

         await interaction.update({
            content: newMuteStatus
               ? (mconfig.success?.userMuted ??
                 defaultMessages.success.userMuted)
               : (mconfig.success?.userUnmuted ??
                 defaultMessages.success.userUnmuted),
            embeds: [embed],
            components: [],
         });
      } catch (error) {
         console.error('Error in manage_talk_select menu:', error);
         await interaction.reply({
            content: mconfig.errors?.generic ?? defaultMessages.errors.generic,
            ephemeral: true,
         });
      }
   },
};
