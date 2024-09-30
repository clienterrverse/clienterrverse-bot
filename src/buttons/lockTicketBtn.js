import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
  customId: 'lockTicketBtn',
  userPermissions: [],
  botPermissions: [PermissionFlagsBits.ManageChannels],

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const { channel, guild, member } = interaction;

      const [ticket, ticketSetup] = await Promise.all([
        ticketSchema.findOne({ ticketChannelID: channel.id }),
        ticketSetupSchema.findOne({ guildID: guild.id }),
      ]);

      if (!ticket || !ticketSetup) {
        return await interaction.editReply({
          content: !ticket
            ? 'Ticket not found.'
            : 'Ticket system is not configured properly.',
        });
      }

      const staffRole = await guild.roles
        .fetch(ticketSetup.staffRoleID)
        .catch(() => null);
      if (!staffRole) {
        return await interaction.editReply({
          content: 'Staff role not found. Please contact an administrator.',
        });
      }

      if (!member.roles.cache.has(staffRole.id)) {
        return await interaction.editReply({
          content: 'You do not have permission to lock or unlock tickets.',
        });
      }

      const isClaimer = member.id === ticket.claimedBy;
      const isAdmin = member.permissions.has(PermissionFlagsBits.Administrator);

      if (!isClaimer && !isAdmin) {
        return await interaction.editReply({
          content:
            'Only the staff member who claimed this ticket or an administrator can lock/unlock it.',
        });
      }

      const ticketMember = await guild.members
        .fetch(ticket.ticketMemberID)
        .catch(() => null);
      if (!ticketMember) {
        return await interaction.editReply({
          content: 'Ticket member not found in the guild.',
        });
      }

      const currentPermissions = channel.permissionsFor(ticketMember);
      if (!currentPermissions) {
        return await interaction.editReply({
          content:
            'Could not determine the current permissions for the ticket member.',
        });
      }

      const isLocked = !currentPermissions.has(
        PermissionFlagsBits.SendMessages
      );
      const newPermissions = {
        [PermissionFlagsBits.SendMessages]: isLocked,
        [PermissionFlagsBits.ViewChannel]: true,
      };

      await channel.permissionOverwrites.edit(ticketMember, newPermissions);

      const embedData = {
        color: isLocked ? 'Green' : 'Orange',
        title: isLocked ? 'Ticket Unlocked' : 'Ticket Locked',
        description: `This ticket has been ${isLocked ? 'unlocked' : 'locked'} by ${member.user.tag}.`,
      };

      const statusEmbed = new EmbedBuilder(embedData);

      await Promise.all([
        interaction.editReply({
          content: `This ticket has been ${isLocked ? 'unlocked' : 'locked'}.`,
        }),
        channel.send({ embeds: [statusEmbed] }),
      ]);
    } catch (error) {
      console.error('Error toggling ticket lock:', error);
      await interaction
        .editReply({
          content:
            'There was an error toggling the ticket lock. Please try again later.',
        })
        .catch(console.error);
    }
  },
};
