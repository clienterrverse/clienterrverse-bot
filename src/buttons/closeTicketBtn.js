import { 
  PermissionFlagsBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder 
} from 'discord.js';

export default {
  customId: "closeTicketBtn",
  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      await interaction.deferReply({ ephemeral: true });

      const confirmCloseTicketEmbed = new EmbedBuilder()
        .setColor("DarkRed")
        .setTitle("Close Ticket")
        .setDescription("Are you sure you want to close this ticket?");

      const confirmCloseTicketBtn = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("confirmCloseTicketBtn")
          .setLabel("Confirm")
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId("cancelCloseTicketBtn")
          .setLabel("Cancel")
          .setStyle(ButtonStyle.Success)
      );

      await interaction.editReply({
        embeds: [confirmCloseTicketEmbed],
        components: [confirmCloseTicketBtn]
      });

    } catch (err) {
      console.error('Error presenting close ticket confirmation:', err);
    }
  }
};
