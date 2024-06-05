import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits
} from 'discord.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';
import ticketSchema from '../schemas/ticketSchema.js';

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
          ephemeral: true
        });
      }

      // Get the ticket category and staff role
      const category = guild.channels.cache.get(ticketSetup.categoryID);
      if (!category) {
        return await interaction.editReply({
          content: 'Ticket category not found.',
          ephemeral: true
        });
      }
      const staffRole = guild.roles.cache.get(ticketSetup.staffRoleID);
      if (!staffRole) {
        return await interaction.editReply({
          content: 'Staff role not found.',
          ephemeral: true
        });
      }
      const username = member.user.username;

      // Create the ticket embed
      const ticketEmbed = new EmbedBuilder()
        .setColor('#9861FF')
        .setAuthor({ name: username, iconURL: member.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`**Subject:** ${subject}\n**Description:** ${description}`)
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
      );

      // Check if there is an open ticket
      let ticket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketMemberID: member.id,
        closed: false,
      });

      if (ticket) {
        return await interaction.editReply({
          content: `You already have an open ticket! <#${ticket.ticketChannelID}>`,
          ephemeral: true
        });
      }

      // Create a new channel in the specified category
      const ticketChannel = await guild.channels.create({
        name: `${username}-${Date.now()}`, // Unique name based on username and timestamp
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages],
          },
          {
            id: staffRole.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          },
        ],
      });

      await ticketChannel.send({
        content: `${staffRole} - Ticket created by ${username}`,
        embeds: [ticketEmbed],
        components: [ticketButtons],
      });

      // Create and save the ticket in the database
      ticket = await ticketSchema.create({
        guildID: guild.id,
        ticketMemberID: member.id,
        ticketChannelID: ticketChannel.id,
        parentTicketChannelID: channel.id, // Ensure this is set correctly
        closed: false,
        membersAdded: [],
        claimedBy: null, // Initially, no one has claimed the ticket
        status: 'open',
        actionLog: [`Ticket created by ${member.user.tag}`] // Initial action log entry
      });

      await ticket.save();

      return await interaction.editReply({
        content: `Your ticket has been created in ${ticketChannel}`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: 'There was an error creating your ticket. Please try again later.',
        ephemeral: true
      });
    }
  },
};
