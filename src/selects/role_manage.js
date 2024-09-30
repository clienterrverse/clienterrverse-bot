import { PermissionFlagsBits } from 'discord.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';

export default {
  customId: 'role_manage',

  run: async (client, interaction) => {
    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      const voiceChannel = member.voice.channel;

      if (!voiceChannel) {
        await interaction.reply({
          content: 'You need to be in a voice channel to manage access.',
          ephemeral: true,
        });
        return;
      }

      const channelId = voiceChannel.id;
      const roleId = interaction.values[0];
      const targetRole = await interaction.guild.roles.fetch(roleId);
      const channelDoc = await JoinToSystemChannel.findOne({ channelId });

      if (!channelDoc) {
        await interaction.reply({
          content: 'This channel is not managed by the join-to-system.',
          ephemeral: true,
        });
        return;
      }

      // Check if the target role has the Connect permission
      const permissions = voiceChannel.permissionsFor(targetRole);
      const hasAccess = permissions.has(PermissionFlagsBits.Connect);

      if (hasAccess) {
        // Remove access
        await voiceChannel.permissionOverwrites.edit(targetRole, {
          Connect: false,
        });
        channelDoc.allowedRoles = channelDoc.allowedRoles.filter(
          (id) => id !== roleId
        );
        await channelDoc.save();

        await interaction.reply({
          content: `Access removed from role: ${targetRole.name}.`,
          ephemeral: true,
        });
      } else {
        // Grant access
        await voiceChannel.permissionOverwrites.edit(targetRole, {
          Connect: true,
        });
        if (!channelDoc.allowedRoles.includes(roleId)) {
          channelDoc.allowedRoles.push(roleId);
        }
        await channelDoc.save();

        await interaction.reply({
          content: `Access granted to role: ${targetRole.name}.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('Error in role_manage interaction:', error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
