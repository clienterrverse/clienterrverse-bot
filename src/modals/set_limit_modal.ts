import {
   EmbedBuilder,
   ButtonBuilder,
   ActionRowBuilder,
   ButtonStyle,
} from 'discord.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
   customId: 'set_limit_modal',
   userPermissions: [],
   botPermissions: [],

   run: async (client, interaction) => {
      try {
         // Perform comprehensive checks
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
                  'You do not have permission to manage this channel.',
               ephemeral: true,
            });
         }

         const userLimit = interaction.fields.getTextInputValue('user_limit');
         const limitNumber = parseInt(userLimit, 10);

         if (isNaN(limitNumber) || limitNumber <= 0) {
            return interaction.reply({
               content: 'Please enter a valid positive number.',
               ephemeral: true,
            });
         }

         const member = await interaction.guild.members.fetch(
            interaction.user.id
         );
         const voiceChannel = member.voice.channel;

         if (!voiceChannel) {
            return interaction.reply({
               content:
                  'You need to be in a voice channel to set the user limit.',
               ephemeral: true,
            });
         }

         await voiceChannel.setUserLimit(limitNumber);

         // Update the user limit in the database
         const channelDoc = await JoinToSystemChannel.findOneAndUpdate(
            { channelId: voiceChannel.id },
            { userLimit: limitNumber },
            { new: true }
         );

         await interaction.reply({
            content: `User limit set to ${limitNumber} for the voice channel.`,
            ephemeral: true,
         });
      } catch (error) {
         console.error(error);
         return interaction.reply({
            content: 'An error occurred while processing your request.',
            ephemeral: true,
         });
      }
   },
};
