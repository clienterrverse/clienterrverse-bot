/** @format */
import {
  EmbedBuilder,
  ActionRowBuilder,
  UserSelectMenuBuilder,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
  customId: 'select_owner',
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
        .setCustomId('owner_select')
        .setPlaceholder('Select the new owner')
        .setMinValues(1)
        .setMaxValues(1);

      const row = new ActionRowBuilder().addComponents(selectMenu);

      // Send the menu
      await interaction.reply({
        content: 'Please select the new owner for this channel:',
        components: [row],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error in select_owner button:', error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
