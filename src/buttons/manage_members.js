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
      await interaction.deferReply({ ephemeral: true });

      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        !checkResult.isOwner
      ) {
        return await interaction.editReply({
          content: checkResult.message,
        });
      }

      const selectMenu = new UserSelectMenuBuilder()
        .setCustomId('members_manage')
        .setPlaceholder('Select a user to manage access')
        .setMinValues(1)
        .setMaxValues(1);

      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      const embed = new EmbedBuilder()
        .setTitle('Manage Channel Members')
        .setDescription(
          'Select a user to grant or remove access to the channel.'
        )
        .setColor('Blue')
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: [actionRow],
      });
    } catch (error) {
      console.error('Error in manage_members interaction:', error);

      const errorMessage =
        'An error occurred while processing your request. Please try again later.';

      if (interaction.deferred) {
        await interaction
          .editReply({ content: errorMessage })
          .catch(console.error);
      } else {
        await interaction
          .reply({ content: errorMessage, ephemeral: true })
          .catch(console.error);
      }
    }
  },
};
