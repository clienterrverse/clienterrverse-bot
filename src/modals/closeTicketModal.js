import { EmbedBuilder } from 'discord.js';
import { closeTicket } from '../utils/ticket/ticketClose.js';

export default {
   customId: 'closeTicketModal',
   userPermissions: [],
   botPermissions: [],
   run: async (client, interaction) => {
      try {
         const { channel, member, guild, fields } = interaction;

         await interaction.deferReply({ ephemeral: true });

         const reason =
            fields.getTextInputValue('closeTicketReason') ||
            'No reason provided';

         const result = await closeTicket(
            client,
            guild,
            channel,
            member,
            reason
         );

         if (result.success) {
            const closedEmbed = new EmbedBuilder()
               .setColor('Red')
               .setTitle('Ticket Closed')
               .setDescription('This ticket has been closed.');

            await interaction.editReply({ embeds: [closedEmbed] });
         } else {
            await interaction.editReply({
               content: result.message,
               ephemeral: true,
            });
         }
      } catch (error) {
         console.error('Error handling ticket closure:', error);
         await interaction.editReply({
            content:
               'There was an error closing the ticket. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
