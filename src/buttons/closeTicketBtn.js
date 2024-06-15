import {
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder
} from 'discord.js';

export default {
  customId: "closeTicketBtn",
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

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

      await interaction.editReply({ content: 'Please confirm ticket closure.', ephemeral: true });
    } catch (err) {
      console.error('Error presenting close ticket confirmation:', err);
      await interaction.editReply({
        content: 'There was an error presenting the close ticket confirmation. Please try again later.',
        ephemeral: true,
      });
    }
  }
};
