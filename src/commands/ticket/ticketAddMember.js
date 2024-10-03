import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-add-member')
    .setDescription('Add a member to a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('The member to add to the ticket.')
        .setRequired(true)
    ),

  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  category: 'ticket',

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel, guild } = interaction;
      const memberToAdd = interaction.options.getMember('member');

      if (!memberToAdd) {
        return await interaction.editReply({
          content: 'The specified member was not found in the server.',
          ephemeral: true,
        });
      }

      const ticket = await Ticket.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id,
        closed: false,
      });

      if (!ticket) {
        return await interaction.editReply({
          content: 'This channel is not an active ticket channel.',
          ephemeral: true,
        });
      }

      if (channel.permissionOverwrites.cache.has(memberToAdd.id)) {
        return await interaction.editReply({
          content: 'This member is already in the ticket.',
          ephemeral: true,
        });
      }

      // Add member to ticket
      await Ticket.findOneAndUpdate(
        { _id: ticket._id },
        { $addToSet: { membersAdded: memberToAdd.id } }
      );

      await channel.permissionOverwrites.create(memberToAdd, {
        ViewChannel: true,
        SendMessages: true,
      });

      return await interaction.editReply({
        content: `Successfully added ${memberToAdd.user.tag} to the ticket.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error adding member to ticket:', err);
      return await interaction.editReply({
        content:
          'An error occurred while adding the member to the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
