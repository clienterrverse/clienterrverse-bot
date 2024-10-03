import { createTicket } from '../utils/ticket/ticketCreate.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
  customId: 'createTicket',
  run: async (client, interaction) => {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const selectedOption = interaction.values[0];

      await interaction.deferReply({ ephemeral: true });

      // Fetch ticket setup configuration from the database
      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: interaction.guild.id,
      });
      if (!ticketSetup) {
        return await interaction.editReply({
          content: 'Ticket setup not found.',
          ephemeral: true,
        });
      }

      // Get the ticket category and staff role
      const category = interaction.guild.channels.cache.get(
        ticketSetup.categoryID
      );
      if (!category) {
        return await interaction.editReply({
          content: 'Ticket category not found.',
          ephemeral: true,
        });
      }

      const staffRole = interaction.guild.roles.cache.get(
        ticketSetup.staffRoleID
      );
      if (!staffRole) {
        return await interaction.editReply({
          content: 'Staff role not found.',
          ephemeral: true,
        });
      }

      // Find the selected option in the custom options
      const selectedOptionData = ticketSetup.customOptions.find(
        (option) => option.value === selectedOption
      );
      if (!selectedOptionData) {
        return await interaction.editReply({
          content: 'Invalid ticket option selected.',
          ephemeral: true,
        });
      }

      const result = await createTicket(
        interaction.guild,
        member,
        staffRole,
        category,
        selectedOptionData.label,
        selectedOptionData.description,
        interaction.channelId
      );

      await interaction.editReply({
        content: result.message,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error in createTicket interaction:', error);
      await interaction.editReply({
        content: 'An error occurred while processing your request.',
        ephemeral: true,
      });
    }
  },
};
