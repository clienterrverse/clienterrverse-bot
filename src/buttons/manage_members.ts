/** @format */
import {
   EmbedBuilder,
   ActionRowBuilder,
   UserSelectMenuBuilder,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
   customId: 'manage_members',
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

         // Create the user select menu for managing members
         const selectMenu = new UserSelectMenuBuilder()
            .setCustomId('members_manage')
            .setPlaceholder('Select a user to manage access')
            .setMinValues(1)
            .setMaxValues(1);

         // Create an action row and add the select menu to it
         const actionRow = new ActionRowBuilder().addComponents(selectMenu);

         // Create an embed for the interaction response
         const embed = new EmbedBuilder()
            .setTitle('Manage Channel Members')
            .setDescription(
               'Select a user to grant or remove access to the channel.'
            )
            .setColor('Blue');

         // Reply to the interaction with the embed and action row
         await interaction.reply({
            embeds: [embed],
            components: [actionRow],
            ephemeral: true,
         });
      } catch (error) {
         console.error('Error in manage_members interaction:', error);
         await interaction.reply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
