import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';
import ticketSetupSchema from "../schemas/ticketSetupSchema.js";

export default {
  customId: "closeTicketBtn",
  userPermissions: [],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { guild, member } = interaction;

      // Get the ticket setup configuration to check for staff role
      const ticketSetup = await ticketSetupSchema.findOne({ guildID: guild.id });
      if (!ticketSetup) {
        console.error('Ticket setup not found for guild ID:', guild.id);
        return await interaction.reply({
          content: "Ticket system is not configured properly.",
          ephemeral: true,
        });
      }

      const staffRole = guild.roles.cache.get(ticketSetup.staffRoleID);
      if (!staffRole) {
        console.error('Staff role not found in guild for role ID:', ticketSetup.staffRoleID);
        return await interaction.reply({
          content: "Staff role not found. Please contact an administrator.",
          ephemeral: true,
        });
      }

      // Check if the member has the staff role
      if (!member.roles.cache.has(staffRole.id)) {
        return await interaction.reply({
          content: "You do not have permission to close tickets.",
          ephemeral: true,
        });
      }

      const closeTicketModal = new ModalBuilder()
        .setCustomId('closeTicketModal')
        .setTitle('Close Ticket Confirmation');

      const reasonInput = new TextInputBuilder()
        .setCustomId('closeTicketReason')
        .setLabel('Reason for closing (optional)')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(false);

      const actionRow = new ActionRowBuilder().addComponents(reasonInput);
      closeTicketModal.addComponents(actionRow);

      await interaction.showModal(closeTicketModal);

    } catch (err) {
      console.error('Error presenting close ticket confirmation:', err);
      await interaction.reply({
        content: 'There was an error presenting the close ticket confirmation. Please try again later.',
        ephemeral: true,
      });
    }
  }
};
