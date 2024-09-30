import { PermissionFlagsBits } from 'discord.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';

export default {
  customId: 'members_manage',

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
      const userId = interaction.values[0];
      const targetMember = await interaction.guild.members.fetch(userId);
      const channelDoc = await JoinToSystemChannel.findOne({ channelId });

      // Check if the target member has the Connect permission
      const permissions = voiceChannel.permissionsFor(targetMember);
      const hasAccess = permissions.has(PermissionFlagsBits.Connect);

      if (hasAccess) {
        // Remove access
        await voiceChannel.permissionOverwrites.edit(targetMember, {
          Connect: false,
        });
        channelDoc.allowedUsers = channelDoc.allowedUsers.filter(
          (id) => id !== userId
        );
        await channelDoc.save();

        await interaction.reply({
          content: `Access removed from ${targetMember.displayName}.`,
          ephemeral: true,
        });
      } else {
        // Grant access
        await voiceChannel.permissionOverwrites.edit(targetMember, {
          Connect: true,
        });
        channelDoc.allowedUsers.push(userId);
        await channelDoc.save();

        await interaction.reply({
          content: `Access granted to ${targetMember.displayName}.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error('Error in members_manage interaction:', error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
