import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { closeTicket } from '../../utils/ticket/ticketClose.js';
import ticketSchema from '../../schemas/ticketSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('close-all-tickets')
    .setDescription('Close all open tickets in the guild')
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for closing all tickets')
        .setRequired(false)
    ),
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  category: 'ticket',
  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    const reason =
      interaction.options.getString('reason') || 'Mass ticket closure';

    try {
      const guild = interaction.guild;
      const openTickets = await ticketSchema.find({
        guildID: guild.id,
        closed: false,
      });

      if (openTickets.length === 0) {
        return interaction.editReply(
          'There are no open tickets in this guild.'
        );
      }

      let closedCount = 0;
      let failedCount = 0;

      for (const ticket of openTickets) {
        const channel = guild.channels.cache.get(ticket.ticketChannelID);
        if (channel) {
          const result = await closeTicket(
            client,
            guild,
            channel,
            interaction.member,
            reason
          );
          if (result.success) {
            closedCount++;
          } else {
            failedCount++;
            console.error(
              `Failed to close ticket ${ticket.ticketChannelID}: ${result.message}`
            );
          }
        } else {
          // Update the ticket in the database even if the channel is not found
          await ticketSchema.findOneAndUpdate(
            {
              guildID: guild.id,
              ticketChannelID: ticket.ticketChannelID,
            },
            {
              closed: true,
              closeReason: reason,
              status: 'closed',
              closedBy: interaction.member.id,
            },
            { new: true }
          );
          closedCount++;
          console.log(
            `Channel not found for ticket ${ticket.ticketChannelID}, but database updated`
          );
        }
      }

      await interaction.editReply(
        `Operation completed. Successfully closed ${closedCount} ticket(s). Failed to close ${failedCount} ticket(s).`
      );
    } catch (error) {
      console.error('Error closing tickets:', error);
      await interaction.editReply(
        'An error occurred while closing tickets. Please check the console for more details.'
      );
    }
  },
};
