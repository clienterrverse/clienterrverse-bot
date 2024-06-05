import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
  customId: 'claimTicketBtn',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const { member, channel, guild } = interaction;
      
      // Fetch the ticket setup from the database
      const setupTicket = await ticketSetupSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id
      });

      // Check if the setupTicket exists
      if (!setupTicket) {
        return await interaction.reply({
          content: 'Ticket setup not found.',
          ephemeral: true,
        });
      }

      // Check if the user has the required role to claim tickets
      const staffRoleId = setupTicket.staffRoleID;
      if (!member.roles.cache.has(staffRoleId)) {
        return await interaction.reply({
          content: 'You do not have the necessary permissions to claim this ticket.',
          ephemeral: true,
        });
      }

      // Fetch the ticket from the database
      const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

      // If the ticket does not exist, notify the user
      if (!ticket) {
        return await interaction.reply({
          content: 'Ticket not found.',
          ephemeral: true,
        });
      }

      // If the ticket is already claimed, notify the user
      if (ticket.claimedBy) {
        return await interaction.reply({
          content: `This ticket has already been claimed by <@${ticket.claimedBy}>.`,
          ephemeral: true,
        });
      }

      await channel.permissionOverwrites.edit(member.id, {
        [PermissionFlagsBits.ViewChannel]: true,
        [PermissionFlagsBits.SendMessages]: true,
        [PermissionFlagsBits.ManageChannels]: true,
      });

      await channel.permissionOverwrites.edit(channel.guild.roles.everyone.id, {
        [PermissionFlagsBits.ViewChannel]: false,
      });

      await channel.permissionOverwrites.edit(ticket.ticketMemberID, {
        [PermissionFlagsBits.ViewChannel]: true,
        [PermissionFlagsBits.SendMessages]: true,
      });

      const claimEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`${member} has claimed this ticket.`)
        .setTimestamp();

      await channel.send({ embeds: [claimEmbed] });

      ticket.claimedBy = member.id;
      await ticket.save();

      return await interaction.reply({
        content: 'You have claimed this ticket.',
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error claiming ticket:', error);
      // Notify the user if an error occurs
      await interaction.reply({
        content: 'There was an error claiming the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
