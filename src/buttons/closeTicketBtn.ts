import {
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
} from 'discord.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
   customId: 'closeTicketBtn',
   userPermissions: [],
   botPermissions: [],

   run: async (client, interaction) => {
      try {
         const { guild, member } = interaction;

         // Get the ticket setup configuration
         const ticketSetup = await ticketSetupSchema.findOne({
            guildID: guild.id,
         });
         if (!ticketSetup) {
            return await interaction.reply({
               content:
                  'Ticket system is not configured properly. Please contact an administrator.',
               ephemeral: true,
            });
         }

         // Check if the member has the staff role
         if (!member.roles.cache.has(ticketSetup.staffRoleID)) {
            return await interaction.reply({
               content: 'You do not have permission to close tickets.',
               ephemeral: true,
            });
         }

         // Create and show the modal
         const closeTicketModal = new ModalBuilder()
            .setCustomId('closeTicketModal')
            .setTitle('Close Ticket Confirmation')
            .addComponents(
               new ActionRowBuilder().addComponents(
                  new TextInputBuilder()
                     .setCustomId('closeTicketReason')
                     .setLabel('Reason for closing (optional)')
                     .setStyle(TextInputStyle.Paragraph)
                     .setRequired(false)
                     .setMaxLength(1000)
               )
            );

         await interaction.showModal(closeTicketModal);
      } catch (err) {
         await interaction.reply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
