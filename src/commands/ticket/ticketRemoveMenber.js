import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-remove-member')
    .setDescription('Remove a member from a ticket.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads)
    .addUserOption(option =>
      option.setName('member')
        .setDescription('The member to remove from the ticket.')
        .setRequired(true))
    .toJSON(),

  userPermissions: [PermissionFlagsBits.ManageThreads],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const { channel, options, guild } = interaction;
      await interaction.deferReply({ ephemeral: true });

      const memberToRemove = options.getUser('member');

      const ticket = await Ticket.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id,
        closed: false
      });

      if (!ticket) {
        return await interaction.editReply({
          content: 'This channel is not a ticket channel.',
          ephemeral: true
        });
      }

      const memberExistsInServer = guild.members.cache.has(memberToRemove.id);
      if (!memberExistsInServer) {
        return await interaction.editReply({
          content: 'The member you specified is not in the server.',
          ephemeral: true
        });
      }

      const threadMember = await guild.members.fetch(memberToRemove.id).catch(() => null);

      if (!threadMember || !channel.permissionOverwrites.cache.has(memberToRemove.id)) {
        return await interaction.editReply({
          content: `The member you specified isn't in the ticket.`,
          ephemeral: true
        });
      }

      await Ticket.findOneAndUpdate(
        {
          guildID: guild.id,
          ticketChannelID: channel.id,
          closed: false
        },
        {
          $pull: { membersAdded: memberToRemove.id }
        },
        { new: true }
      );

      await channel.permissionOverwrites.delete(memberToRemove.id);

      return await interaction.editReply({
        content: `Successfully removed ${memberToRemove.tag} from the ticket.`,
        ephemeral: true
      });
    } catch (err) {
      console.error('Error removing member from ticket:', err);
      return await interaction.editReply({
        content: 'An error occurred while trying to remove the member from the ticket.',
        ephemeral: true
      });
    }
  }
};
