import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-remove-member')
    .setDescription('Remove a member from a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
    .addUserOption((option) =>
      option
        .setName('member')
        .setDescription('The member to remove from the ticket.')
        .setRequired(true)
    ),

  userPermissions: [PermissionFlagsBits.ManageChannels],
  botPermissions: [PermissionFlagsBits.ManageChannels],
  category: 'ticket',

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel, guild } = interaction;
      const memberToRemove = interaction.options.getMember('member');

      if (!memberToRemove) {
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

      if (!channel.permissionOverwrites.cache.has(memberToRemove.id)) {
        return await interaction.editReply({
          content: 'This member is not in the ticket.',
          ephemeral: true,
        });
      }

      // Remove member from ticket
      await Ticket.findOneAndUpdate(
        {
          guildID: guild.id,
          ticketChannelID: channel.id,
          closed: false,
        },
        {
          $pull: { membersAdded: memberToRemove.id },
        }
      );

      await channel.permissionOverwrites.delete(memberToRemove);

      return await interaction.editReply({
        content: `Successfully removed ${memberToRemove.user.tag} from the ticket.`,
        ephemeral: true,
      });
    } catch (err) {
      console.error('Error removing member from ticket:', err);
      return await interaction.editReply({
        content:
          'An error occurred while removing the member from the ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
