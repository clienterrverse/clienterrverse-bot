import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';

export default {
  customId: 'claimTicketBtn',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const { member, channel } = interaction;

      const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

      if (!ticket) {
        return await interaction.reply({
          content: 'Ticket not found.',
          ephemeral: true,
        });
      }

      if (ticket.claimedBy) {
        return await interaction.reply({
          content: `This ticket has already been claimed by <@${ticket.claimedBy}>.`,
          ephemeral: true,
        });
      }

      await channel.permissionOverwrites.edit(member.id, {
        [PermissionFlagsBits.ViewChannel]: true,
        [PermissionFlagsBits.SendMessages]: true,
        [PermissionFlagsBits.ManageChannels]: true
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
      await interaction.reply({
        content: 'There was an error claiming the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
