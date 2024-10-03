// src/utils/join-to-system/voiceChannelChecks.js

import JoinToSystemChannel from '../../schemas/joinToSystemSchema.js';

/**
 * Comprehensive check for voice channel ownership and presence
 * @param {string} userId - The ID of the user to check
 * @param {Discord.GuildMember} member - The guild member object
 * @returns {Promise<Object>} - Returns an object with check results and channel info
 */
export async function comprehensiveVoiceCheck(userId, member) {
  if (!member.voice.channel) {
    return {
      inVoice: false,
      isManaged: false,
      isOwner: false,
      channel: null,
      message: 'You need to be in a voice channel to use this command.',
    };
  }

  const channelId = member.voice.channel.id;

  try {
    const managedChannel = await JoinToSystemChannel.findOne({
      channelId: channelId,
    });

    if (!managedChannel) {
      return {
        inVoice: true,
        isManaged: false,
        isOwner: false,
        channel: member.voice.channel,
        message:
          'This voice channel is not managed by the join-to-create system.',
      };
    }

    const isOwner = managedChannel.ownerId === userId;

    return {
      inVoice: true,
      isManaged: true,
      isOwner: isOwner,
      channel: member.voice.channel,
      managedChannel: managedChannel,
      message: isOwner ? null : "You don't have ownership of this channel.",
    };
  } catch (error) {
    console.error('Error during voice channel checks:', error);
    return {
      inVoice: true,
      isManaged: false,
      isOwner: false,
      channel: member.voice.channel,
      message: 'An error occurred while checking channel ownership.',
    };
  }
}

/**
 * Middleware to perform comprehensive voice channel checks before executing a command
 * @param {function} commandFunction - The command function to execute if all checks pass
 * @param {Object} options - Options for the middleware
 * @param {boolean} options.requireOwnership - Whether to require channel ownership
 * @returns {function} - Returns a middleware function
 */
export function requireVoiceChecks(
  commandFunction,
  options = { requireOwnership: true }
) {
  return async (client, interaction) => {
    const checkResult = await comprehensiveVoiceCheck(
      interaction.user.id,
      interaction.member
    );

    if (
      !checkResult.inVoice ||
      !checkResult.isManaged ||
      (options.requireOwnership && !checkResult.isOwner)
    ) {
      return interaction.reply({
        content: checkResult.message,
        ephemeral: true,
      });
    }

    // All checks passed, execute the command
    return commandFunction(client, interaction, checkResult);
  };
}
