/** @format */
import {
   ModalBuilder,
   ActionRowBuilder,
   TextInputBuilder,
   TextInputStyle,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
   customId: 'set_limit',
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

         // Create the modal
         const modal = new ModalBuilder()
            .setCustomId('set_limit_modal')
            .setTitle('Set Voice Channel User Limit');

         // Create the text input field
         const limitInput = new TextInputBuilder()
            .setCustomId('user_limit')
            .setLabel('Enter the user limit for the voice channel:')
            .setPlaceholder('Enter a number')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

         // Add the input field to the modal
         const actionRow = new ActionRowBuilder().addComponents(limitInput);
         modal.addComponents(actionRow);

         // Show the modal to the user
         await interaction.showModal(modal);
      } catch (error) {
         await interaction.reply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
