import { createTicket } from '../utils/ticket/ticketCreate.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
  customId: 'ticketModal',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const { fields, guild, member, channel } = interaction;

      // Retrieve values from the modal
      const subject = fields.getTextInputValue('ticketSubject');
      const description = fields.getTextInputValue('ticketDesc');

      await interaction.deferReply({ ephemeral: true });

      // Fetch ticket setup configuration from the database
      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
      });

      if (!ticketSetup) {
        return await interaction.editReply({
          content: 'Ticket setup not found.',
          ephemeral: true,
        });
      }

      // Get the ticket category and staff role
      const category = guild.channels.cache.get(ticketSetup.categoryID);
      if (!category) {
        return await interaction.editReply({
          content: 'Ticket category not found.',
          ephemeral: true,
        });
      }
      const staffRole = guild.roles.cache.get(ticketSetup.staffRoleID);
      if (!staffRole) {
        return await interaction.editReply({
          content: 'Staff role not found.',
          ephemeral: true,
        });
      }

      const result = await createTicket(
        guild,
        member,
        staffRole,
        category,
        subject,
        description,
        channel.id
      );

      await interaction.editReply({
        content: result.message,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error handling ticket creation:', error);
      await interaction.editReply({
        content:
          'There was an error creating your ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
