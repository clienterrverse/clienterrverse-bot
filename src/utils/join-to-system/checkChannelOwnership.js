// src/utils/join-to-system/voiceChannelChecks.js

import JoinToSystemChannel from '../../schemas/joinToSystemSchema.js';

// Constants for messages
const MESSAGES = {
  NOT_IN_VOICE: 'You need to be in a voice channel to use this command.',
  NOT_MANAGED: 'This voice channel is not managed by the join-to-create system.',
  NOT_OWNER: "You don't have ownership of this channel.",
  CHECK_ERROR: 'An error occurred while checking channel ownership.',
};

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
      message: MESSAGES.NOT_IN_VOICE,
    };
  }

  const channelId = member.voice.channel.id;

  try {
    const managedChannel = await JoinToSystemChannel.findOne({ channelId });

    if (!managedChannel) {
      return {
        inVoice: true,
        isManaged: false,
        isOwner: false,
        channel: member.voice.channel,
        message: MESSAGES.NOT_MANAGED,
      };
    }

    const isOwner = managedChannel.ownerId === userId;

    return {
      inVoice: true,
      isManaged: true,
      isOwner,
      channel: member.voice.channel,
      managedChannel,
      message: isOwner ? null : MESSAGES.NOT_OWNER,
    };
  } catch (error) {
    client.errorHandler.handleError(error, { type: 'modalLoad' });
    return {
      inVoice: true,
      isManaged: false,
      isOwner: false,
      channel: member.voice.channel,
      message: MESSAGES.CHECK_ERROR,
    };
  }
}

/**
 * Middleware to perform comprehensive voice channel checks before executing a command
 * @param {function} commandFunction - The command function to execute if all checks pass
 * @param {Object} options - Options for the middleware
 * @param {boolean} [options.requireOwnership=true] - Whether to require channel ownership
 * @returns {function} - Returns a middleware function
 */
export function requireVoiceChecks(
  commandFunction,
  { requireOwnership = true } = {}
) {
  return async (client, interaction) => {
    try {
      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        (requireOwnership && !checkResult.isOwner)
      ) {
        return interaction.reply({
          content: checkResult.message,
          ephemeral: true,
        });
      }

      // All checks passed, execute the command
      return commandFunction(client, interaction, checkResult);
    } catch (error) {
      client.errorHandler.handleError(error, { type: 'modalLoad' });
      return interaction.reply({
        content: MESSAGES.CHECK_ERROR,
        ephemeral: true,
      });
    }
  };
}
