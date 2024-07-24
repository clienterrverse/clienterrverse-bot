/** @format */
import { ActionRowBuilder, UserSelectMenuBuilder } from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
   customId: 'kick_user',
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
                  'You do not have permission to kick users from this channel.',
               ephemeral: true,
            });
         }

         const voiceChannel = interaction.member.voice.channel;

         if (!voiceChannel) {
            return interaction.reply({
               content: 'You are not in a voice channel.',
               ephemeral: true,
            });
         }

         // Create the user select menu
         const selectMenu = new UserSelectMenuBuilder()
            .setCustomId('kick_user_select')
            .setPlaceholder('Select a user to kick')
            .setMinValues(1)
            .setMaxValues(1);

         // Create an action row and add the select menu to it
         const actionRow = new ActionRowBuilder().addComponents(selectMenu);

         // Reply to the interaction with the select menu
         await interaction.reply({
            content: 'Select a user to kick:',
            components: [actionRow],
            ephemeral: true,
         });
      } catch (error) {
         console.error('Error in kick_user interaction:', error);
         await interaction.reply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
