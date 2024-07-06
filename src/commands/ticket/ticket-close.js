import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { closeTicket } from '../../utils/ticket/ticketClose.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Close the current ticket')
    .addStringOption((option) =>
      option
        .setName('reason')
        .setDescription('The reason for closing the ticket')
        .setRequired(false)
    ),

  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],

  run: async (client, interaction) => {
    // Defer the reply as ticket closing might take some time
    await interaction.deferReply({ ephemeral: true });

    const reason =
      interaction.options.getString('reason') || 'No reason provided';

    // Check if the channel is a ticket channel
    const result = await closeTicket(
      client,
      interaction.guild,
      interaction.channel,
      interaction.member,
      reason
    );

    if (result.success) {
      await interaction.editReply({ content: result.message, ephemeral: true });
    } else {
      await interaction.editReply({
        content: `Error: ${result.message}`,
        ephemeral: true,
      });
    }
  },
};