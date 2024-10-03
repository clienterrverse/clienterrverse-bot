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
      const { guild, member, channel } = interaction;

      await interaction.deferReply({ ephemeral: true });

      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
      });
      if (!ticketSetup) {
        return await interaction.editReply({
          content:
            'Ticket system is not configured properly. Please contact an administrator.',
        });
      }

      // Check if the member has the staff role
      if (!member.roles.cache.has(ticketSetup.staffRoleID)) {
        return await interaction.editReply({
          content: 'You do not have permission to request user info.',
        });
      }

      // Get the current ticket information
      const currentTicket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id,
        closed: false,
      });

      if (!currentTicket) {
        return await interaction.editReply({
          content: 'This ticket is not valid or is closed.',
        });
      }

      // Fetch all closed tickets for this user
      const tickets = await ticketSchema
        .find({
          guildID: guild.id,
          ticketMemberID: currentTicket.ticketMemberID,
          closed: true,
        })
        .sort({ closedAt: -1 }); // Sort by closing date, newest first

      if (!tickets || tickets.length === 0) {
        return await interaction.editReply({
          content: 'This user has no closed tickets.',
        });
      }

      // Format tickets into pages
      const pages = tickets.map((ticket) => {
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
                ? `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`
                : 'Unknown',
              inline: true,
            },
            {
              name: '⏳ Open Duration',
              value: ticket.createdAt
                ? `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:R>`
                : 'Unknown',
              inline: true,
            },
            {
              name: '🔒 Closed At',
              value: ticket.closedAt
                ? `<t:${Math.floor(new Date(ticket.closedAt).getTime() / 1000)}:R>`
                : 'Not closed yet',
              inline: true,
            },
            {
              name: '🔖 Claimed By',
              value: claimedBy,
              inline: true,
            },
            {
              name: '📝 Close Reason',
              value: closeReason,
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
      } else {
        await interaction.editReply({
          content:
            'An error occurred while processing your request. Please try again later.',
        });
      }
    }
  },
};
