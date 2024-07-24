/** @format */
import {
   EmbedBuilder,
   ActionRowBuilder,
   UserSelectMenuBuilder,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
   customId: 'manage_talk_access',
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
               content: checkResult.message,
               ephemeral: true,
            });
         }

         // Create the user select menu
         const selectMenu = new UserSelectMenuBuilder()
            .setCustomId('manage_talk_select')
            .setPlaceholder('Select a user to toggle talk access')
            .setMinValues(1)
            .setMaxValues(1);

         const row = new ActionRowBuilder().addComponents(selectMenu);

         // Send the menu
         await interaction.reply({
            content: 'Please select a user to mute/unmute in this channel:',
            components: [row],
            ephemeral: true,
         });
      } catch (error) {
         console.error('Error in manage_talk_access button:', error);
         await interaction.reply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
