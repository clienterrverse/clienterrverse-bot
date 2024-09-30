/** @format */

import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import ticketSchema from '../../schemas/ticketSchema.js';

export async function createTicket(
  guild,
  member,
  staffRole,
  category,
  subject = 'No subject provided',
  description = 'No description provided',
  parentChannelId
) {
  try {
    const username = member.user.username;

    // Check for existing open tickets
    const existingTicket = await ticketSchema.findOne({
      guildID: guild.id,
      ticketMemberID: member.id,
      closed: false,
    });

    if (existingTicket) {
      return {
        success: false,
        message: `You already have an open ticket! <#${existingTicket.ticketChannelID}>`,
      };
    }

    // Get previous tickets
    const closedTickets = await ticketSchema
      .find({
        guildID: guild.id,
        ticketMemberID: member.id,
        closed: true,
      })
      .sort({ closedAt: -1 })
      .limit(3);

    let previousTicketsField = 'No previous tickets';
    if (closedTickets.length > 0) {
      previousTicketsField = closedTickets
        .map((ticket, index) => {
          const claimedBy = ticket.claimedBy
            ? `<@${ticket.claimedBy}>`
            : 'Unclaimed';
          const closeReason = ticket.closeReason
            ? ticket.closeReason
            : 'No reason provided';
          return `Ticket ${
            index + 1
          }:\n- Claimed by: ${claimedBy}\n- Close reason: ${closeReason}`;
        })
        .join('\n\n');
    }

    // Create ticket embed
    const ticketEmbed = new EmbedBuilder()
      .setColor('#9861FF')
      .setAuthor({
        name: username,
        iconURL: member.user.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(
        `**Subject:** ${subject}\n**Description:** ${description}`
      )
      .addFields({ name: 'Previous Tickets', value: previousTicketsField })
      .setFooter({
        text: `${guild.name} - Ticket`,
        iconURL: guild.iconURL(),
      })
      .setTimestamp();

    // Create action row with buttons
    const ticketButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('claimTicketBtn')
        .setLabel('Claim Ticket')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('closeTicketBtn')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('lockTicketBtn')
        .setLabel('Lock Ticket')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('requestUserInfoBtn')
        .setLabel('Request User Info')
        .setStyle(ButtonStyle.Secondary)
    );

    // Get ticket count for naming
    const ticketCount = await ticketSchema.countDocuments({
      guildID: guild.id,
    });

    // Create ticket channel
    const ticketChannel = await guild.channels.create({
      name: `ticket-${ticketCount + 1}`,
      type: ChannelType.GuildText,
      parent: category.id,
      permissionOverwrites: [
        {
          id: guild.id,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
          ],
        },
        {
          id: staffRole.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory,
            PermissionFlagsBits.SendMessages,
          ],
        },
      ],
    });

    await ticketChannel.send({
      content: `${staffRole} - Ticket created by ${username}`,
      embeds: [ticketEmbed],
      components: [ticketButtons],
    });

    // Create and save ticket in database
    const newTicket = await ticketSchema.create({
      guildID: guild.id,
      ticketMemberID: member.id,
      ticketChannelID: ticketChannel.id,
      parentTicketChannelID: parentChannelId,
      subject: subject,
      description: description,
      closed: false,
      membersAdded: [],
      claimedBy: null,
      status: 'open',
      actionLog: [`Ticket created by ${member.user.tag}`],
      closeReason: '',
      createdAt: new Date(),
    });

    await newTicket.save();

    return {
      success: true,
      message: `Your ticket has been created in ${ticketChannel}`,
      ticketChannel: ticketChannel,
    };
  } catch (error) {
    console.error('Error creating ticket:', error);
    return {
      success: false,
      message:
        'There was an error creating your ticket. Please try again later.',
    };
  }
}
// Optimize Ticket Embed: Refactor the embed creation into a separate function to improve readability and reuse.

// Handle Channel Creation Errors: Add specific error handling for channel creation to ensure proper feedback if the creation fails.

// Refactor Permission Overwrites: Extract permission overwrites logic into a separate function for better readability and maintainability.

// Review Ticket Count Logic: Ensure that the ticket count logic correctly reflects the number of tickets and doesn't conflict with existing naming conventions.
