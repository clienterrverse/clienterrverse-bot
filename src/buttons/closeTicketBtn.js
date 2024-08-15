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

         // Defer the reply to buy more time for processing
         await interaction.deferReply({ ephemeral: true });

         // Get the ticket setup configuration
         const ticketSetup = await ticketSetupSchema
            .findOne({ guildID: guild.id })
            .catch(() => null);
         if (!ticketSetup) {
            return await interaction.editReply({
               content:
                  'Ticket system is not configured properly. Please contact an administrator.',
            });
         }

         // Check if the staff role exists
         const staffRole = await guild.roles
            .fetch(ticketSetup.staffRoleID)
            .catch(() => null);
         if (!staffRole) {
            return await interaction.editReply({
               content:
                  'The configured staff role no longer exists. Please contact an administrator.',
            });
         }

         // Check if the member has the staff role
         if (!member.roles.cache.has(staffRole.id)) {
            return await interaction.editReply({
               content: 'You do not have permission to close tickets.',
            });
         }

         // Create the modal
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
                     .setPlaceholder(
                        'Enter the reason for closing this ticket...'
                     )
               )
            );

         // Show the modal
         await interaction.deleteReply();
         await interaction.showModal(closeTicketModal);
      } catch (error) {
         console.error('Error in closeTicketBtn:', error);

         // Check if the interaction has already been replied to
         if (interaction.deferred || interaction.replied) {
            await interaction
               .editReply({
                  content:
                     'An error occurred while processing your request. Please try again later.',
               })
               .catch(console.error);
         } else {
            await interaction
               .reply({
                  content:
                     'An error occurred while processing your request. Please try again later.',
                  ephemeral: true,
               })
               .catch(console.error);
         }
      }
   },
};
