import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import ticketSchema from "../schemas/ticketSchema.js";

export default {
  customId: "lockTicketBtn",
  userPermissions: [PermissionFlagsBits.ManageThreads],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { channel, guild, member } = interaction;

      await interaction.deferReply({ ephemeral: true });

      // Get the ticket creator from the database
      const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

      if (!ticket) {
        return await interaction.editReply({
          content: "Ticket not found.",
          ephemeral: true,
        });
      }

      // Check current permissions to determine if the ticket is locked
      const currentPermissions = channel.permissionsFor(ticket.ticketMemberID);
      const isLocked = !currentPermissions.has(PermissionFlagsBits.SendMessages);

      if (isLocked) {
        // Unlock the ticket by updating permissions
        await channel.permissionOverwrites.edit(ticket.ticketMemberID, {
          SendMessages: true
        });

        await interaction.editReply({
          content: "This ticket has been unlocked.",
          ephemeral: true,
        });

        const unlockedEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("Ticket Unlocked")
          .setDescription(`This ticket has been unlocked by ${member.user.tag}.`);

        await channel.send({ embeds: [unlockedEmbed] });
      } else {
        // Lock the ticket by updating permissions
        await channel.permissionOverwrites.edit(ticket.ticketMemberID, {
          SendMessages: false
        });

        await interaction.editReply({
          content: "This ticket has been locked.",
          ephemeral: true,
        });

        const lockedEmbed = new EmbedBuilder()
          .setColor("Orange")
          .setTitle("Ticket Locked")
          .setDescription(`This ticket has been locked by ${member.user.tag}.`);

        await channel.send({ embeds: [lockedEmbed] });
      }
    } catch (err) {
      console.error('Error toggling ticket lock:', err);
      await interaction.editReply({
        content: 'There was an error toggling the ticket lock. Please try again later.',
        ephemeral: true,
      });
    }
  }
};
