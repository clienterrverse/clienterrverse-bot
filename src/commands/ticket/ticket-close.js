import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js'; // Use 'Ticket' to match the exported model name

export default {

   data: new SlashCommandBuilder()
        .setName('ticket-close')
        .setDescription('Add a member to a ticket.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to add to the ticket.')
                .setRequired(true))
        .toJSON(),

        
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
  

}