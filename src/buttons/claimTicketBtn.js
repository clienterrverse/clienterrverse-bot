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
      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
      });

      // Check if the ticket setup exists
      if (!ticketSetup) {
        return await interaction.reply({
          content: 'Ticket setup not found.',
          ephemeral: true,
        });
      }

      // Check if the user has the required role to claim tickets
      const staffRoleId = ticketSetup.staffRoleID;
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

      // Update channel permissions to allow the staff member to manage the ticket
      await channel.permissionOverwrites.edit(member.id, {
        [PermissionFlagsBits.ViewChannel]: true,
        [PermissionFlagsBits.SendMessages]: true,
        [PermissionFlagsBits.ManageChannels]: true,
      });

      // Update channel permissions to restrict others from viewing the channel
      await channel.permissionOverwrites.edit(guild.roles.everyone.id, {
        [PermissionFlagsBits.ViewChannel]: false,
      });

      // Allow the ticket member to still view and send messages in the channel
      await channel.permissionOverwrites.edit(ticket.ticketMemberID, {
        [PermissionFlagsBits.ViewChannel]: true,
        [PermissionFlagsBits.SendMessages]: true,
      });

      // Restrict the staff role from viewing the ticket channel (optional, if required)
      const staffRole = guild.roles.cache.get(staffRoleId);
      if (staffRole) {
        await channel.permissionOverwrites.edit(staffRole.id, {
          [PermissionFlagsBits.ViewChannel]: false,
        });
      }

      const claimEmbed = new EmbedBuilder()
        .setColor('#00FF00')
        .setDescription(`${member} has claimed this ticket.`)
        .setTimestamp();


      // Update ticket status in the database
      ticket.claimedBy = member.id;
      await ticket.save();

      return await interaction.reply({ embeds: [claimEmbed] });
    } catch (error) {
      console.error('Error claiming ticket:', error);

      // Handle specific DiscordAPIError
      if (error.code === 10062) {
        return interaction.followUp({
          content: 'This interaction has expired. Please try again.',
          ephemeral: true,
        });
      }

      // General error message
      await interaction.followUp({
        content: 'There was an error claiming the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
