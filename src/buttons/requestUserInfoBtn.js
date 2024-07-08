/** @format */

import { EmbedBuilder } from 'discord.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';
import ticketSchema from '../schemas/ticketSchema.js';
import buttonPagination from '../utils/buttonPagination.js';

export default {
   customId: 'requestUserInfoBtn',
   userPermissions: [],
   botPermissions: [],

   run: async (client, interaction) => {
      try {
         const { guild, member } = interaction;

         // Defer the interaction immediately to prevent timeout
         await interaction.deferReply();

         // Get the ticket setup configuration
         const ticketSetup = await ticketSetupSchema.findOne({
            guildID: guild.id,
         });
         if (!ticketSetup) {
            return await interaction.editReply({
               content:
                  'Ticket system is not configured properly. Please contact an administrator.',
               ephemeral: true,
            });
         }

         // Check if the member has the staff role
         if (!member.roles.cache.has(ticketSetup.staffRoleID)) {
            return await interaction.editReply({
               content: 'You do not have permission to request user info.',
               ephemeral: true,
            });
         }

         // Get user ticket information
         const ticket = await ticketSchema.findOne({
            guildID: guild.id,
            ticketMemberID: interaction.user.id,
         });
         if (!ticket) {
            return await interaction.editReply({
               content: 'User not found. Please specify a valid user.',
               ephemeral: true,
            });
         }

         const user = await guild.members
            .fetch(ticket.ticketMemberID)
            .catch(() => null);
         if (!user) {
            return await interaction.editReply({
               content: 'User not found in this guild.',
               ephemeral: true,
            });
         }

         const tickets = await ticketSchema.find({
            guildID: guild.id,
            ticketMemberID: user.id,
            closed: true,
         });

         if (!tickets || tickets.length === 0) {
            return await interaction.editReply({
               content: 'This user has no tickets.',
               ephemeral: true,
            });
         }

         // Format tickets into pages
         const pages = tickets.map((ticket, index) => {
            const claimedBy = ticket.claimedBy
               ? `<@${ticket.claimedBy}>`
               : 'Unclaimed';
            const transcriptURL = `https://transcript.clienterr.com/api/transcript/${ticket.ticketChannelID}`;
            const closeReason = ticket.closeReason || 'No reason provided';

            return new EmbedBuilder()
               .setTitle(`Ticket ID: ${ticket.ticketChannelID}`)
               .setURL(transcriptURL)
               .addFields(
                  {
                     name: '📝 Subject',
                     value: ticket.subject || 'No subject provided',
                     inline: true,
                  },
                  {
                     name: '🗒️ Description',
                     value: ticket.description || 'No description provided',
                     inline: true,
                  },
                  {
                     name: '📅 Created At',
                     value: ticket.createdAt
                        ? ticket.createdAt.toDateString()
                        : 'Unknown',
                     inline: true,
                  },
                  {
                     name: '⏳ Open Duration',
                     value: `<t:${Math.floor(
                        new Date(ticket.createdAt).getTime() / 1000
                     )}:R>`,
                     inline: true,
                  },
                  {
                     name: '🔒 Closed At',
                     value: `<t:${Math.floor(
                        new Date(ticket.createdAt).getTime() / 1000
                     )}:R>`,
                     inline: true,
                  },
                  {
                     name: '🔖 Claimed By',
                     value: claimedBy || 'Not claimed',
                     inline: true,
                  },
                  {
                     name: '📝 Close Reason',
                     value: closeReason || 'No reason specified',
                     inline: true,
                  },
                  {
                     name: '🧑‍💼 Opened By',
                     value: `<@${ticket.ticketMemberID}>`,
                     inline: true,
                  }
               );
         });

         // Use buttonPagination to display the information
         await buttonPagination(interaction, pages);
      } catch (err) {
         console.error('Error handling request user info button:', err);
         if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
               content:
                  'An error occurred while processing your request. Please try again later.',
               ephemeral: true,
            });
         } else if (interaction.deferred) {
            await interaction.editReply({
               content:
                  'An error occurred while processing your request. Please try again later.',
            });
         }
      }
   },
};
