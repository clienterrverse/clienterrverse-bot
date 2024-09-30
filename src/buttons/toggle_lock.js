/** @format */
import { PermissionsBitField } from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';
import joinToSystemSchema from '../schemas/joinToSystemSchema.js';

export default {
  customId: 'toggle_lock',
  userPermissions: [],
  botPermissions: [PermissionsBitField.Flags.ManageChannels],

  run: async (client, interaction) => {
    try {
      // Perform comprehensive checks
      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        !checkResult.isOwner
      ) {
        return interaction.reply({
          content:
            checkResult.message ||
            (mconfig.errors?.notOwner ?? defaultMessages.errors.notOwner),
          ephemeral: true,
        });
      }

      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: 'You are not in a voice channel.',
          ephemeral: true,
        });
      }

      // Check if the channel is currently locked
      const currentLockStatus = voiceChannel.permissionOverwrites.cache.some(
        (overwrite) =>
          overwrite.id === interaction.guild.id &&
          !overwrite.allow.has(PermissionsBitField.Flags.Connect)
      );

      // Toggle lock status
      if (currentLockStatus) {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: null,
        });
        await joinToSystemSchema.updateOne(
          { channelId: voiceChannel.id },
          { isLocked: false }
        );

        return interaction.reply({
          content: `The voice channel ${voiceChannel.name} has been unlocked.`,
          ephemeral: true,
        });
      } else {
        await voiceChannel.permissionOverwrites.edit(interaction.guild.id, {
          Connect: false,
        });
        await joinToSystemSchema.updateOne(
          { channelId: voiceChannel.id },
          { isLocked: true }
        );

        return interaction.reply({
          content: `The voice channel ${voiceChannel.name} has been locked.`,
          ephemeral: true,
        });
      }
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
