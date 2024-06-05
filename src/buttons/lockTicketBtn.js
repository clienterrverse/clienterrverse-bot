import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import ticketSchema from "../schemas/ticketSchema.js";
import ticketSetupSchema from "../schemas/ticketSetupSchema.js";

export default {
  customId: "lockTicketBtn",
  userPermissions: [PermissionFlagsBits.ManageThreads],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { channel, guild, member } = interaction;

      await interaction.deferReply({ ephemeral: true });

      // Get the ticket creator from the database (assuming ticketSchema is imported)
      const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

      if (!ticket) {
        return await interaction.editReply({
          content: "Ticket not found.",
          ephemeral: true,
        });
      }

      // Lock the channel by updating permissions
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

      const unlockEmbed = new EmbedBuilder()
        .setColor("DarkBlue")
        .setTitle("Ti")
      await channel.send({ embeds: [lockedEmbed] });

    } catch (err) {
      console.error('Error locking ticket:', err);
      await interaction.editReply({
        content: 'There was an error locking the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  }
};
