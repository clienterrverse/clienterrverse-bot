import { ChannelType, PermissionFlagsBits } from 'discord.js';
import JoinToSystem from '../../schemas/joinToSystemSchema.js';
import JoinToSystemSetup from '../../schemas/joinToSystemSetup.js';
import createVoiceChannel from '../../utils/join-to-system/createVoiceChannel.js';

/**
 * Handles the voice state update event for join, leave, and move actions.
 *
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {{ handleError: Function }} errorHandler - An object containing an error handling function.
 * @param {import('discord.js').VoiceState} oldState - The old voice state of the member.
 * @param {import('discord.js').VoiceState} newState - The new voice state of the member.
 */
export default async (client, { handleError }, oldState, newState) => {
  try {
    if (!oldState.channelId && newState.channelId) {
      await handleJoin(newState);
    } else if (oldState.channelId && !newState.channelId) {
      await handleLeave(oldState);
    } else if (oldState.channelId !== newState.channelId) {
      await handleMove(oldState, newState);
    }
  } catch (error) {
    handleError(error, { type: 'joinToCreate event' });
  }
};

/**
 * Handles the join action by creating a new voice channel if necessary.
 *
 * @param {import('discord.js').VoiceState} newState - The new voice state of the member.
 */
async function handleJoin(newState) {
  const setup = await JoinToSystemSetup.findOne({
    guildId: newState.guild.id,
  });
  if (setup && setup.joinToCreateChannelId === newState.channelId) {
    try {
      const newChannel = await createVoiceChannel(
        newState.member,
        newState.guild,
        newState.client
      );
      if (newChannel) {
        await JoinToSystem.create({
          guildId: newState.guild.id,
          channelId: newChannel.id,
          ownerId: newState.member.id,
        });
        await newState.setChannel(newChannel);
      }
    } catch (error) {
      console.error('Error creating new channel:', error);
    }
  }
}

/**
 * Handles the leave action by deleting the channel if it's empty.
 *
 * @param {import('discord.js').VoiceState} oldState - The old voice state of the member.
 */
async function handleLeave(oldState) {
  const channel = await JoinToSystem.findOne({
    channelId: oldState.channelId,
  });
  if (channel && oldState.channel) {
    try {
      const updatedChannel = await oldState.channel.fetch();
      if (updatedChannel.members.size === 0) {
        await updatedChannel.delete();
        await JoinToSystem.deleteOne({ channelId: oldState.channelId });
      }
    } catch (error) {
      console.error('Error handling channel leave:', error);
    }
  }
}

/**
 * Handles the move action by creating a new channel if moving to a joinToCreate channel,
 * or by checking permissions and handling the leave action for the old channel.
 *
 * @param {import('discord.js').VoiceState} oldState - The old voice state of the member.
 * @param {import('discord.js').VoiceState} newState - The new voice state of the member.
 */
async function handleMove(oldState, newState) {
  const setup = await JoinToSystemSetup.findOne({
    guildId: newState.guild.id,
  });
  const isMovingFromJoinToCreate =
    setup && setup.joinToCreateChannelId === oldState.channelId;
  const isMovingToJoinToCreate =
    setup && setup.joinToCreateChannelId === newState.channelId;

  if (isMovingToJoinToCreate) {
    try {
      const newChannel = await createVoiceChannel(
        newState.member,
        newState.guild,
        newState.client
      );
      if (newChannel) {
        await JoinToSystem.create({
          guildId: newState.guild.id,
          channelId: newChannel.id,
          ownerId: newState.member.id,
        });
        await newState.setChannel(newChannel);
        // Delete the Join to Create channel
        const joinToCreateChannel = newState.channel;
        setTimeout(async () => {
          try {
            await joinToCreateChannel.delete();
          } catch (error) {
            console.error('Error deleting Join to Create channel:', error);
          }
        }, 1000); // Delay to ensure the member has moved to the new channel
      }
    } catch (error) {
      console.error('Error creating new channel:', error);
    }
  } else {
    const newChannel = await JoinToSystem.findOne({
      channelId: newState.channelId,
    });
    if (newChannel) {
      const canJoin = await checkJoinPermission(
        newState.member,
        newState.channel
      );
      if (!canJoin) {
        await newState.setChannel(oldState.channel);
        return;
      }
    }
    await handleLeave(oldState);
  }

  // Handle leaving the old channel if it's a created channel
  const oldChannel = await JoinToSystem.findOne({
    channelId: oldState.channelId,
  });
  if (oldChannel && oldState.channel) {
    try {
      const updatedOldChannel = await oldState.channel.fetch();
      if (updatedOldChannel.members.size === 0) {
        await updatedOldChannel.delete();
        await JoinToSystem.deleteOne({ channelId: oldState.channelId });
      }
    } catch (error) {
      console.error('Error handling old channel leave:', error);
    }
  }
}

/**
 * Checks if a member has permission to join a channel.
 *
 * @param {import('discord.js').GuildMember} member - The member attempting to join.
 * @param {import('discord.js').VoiceChannel} channel - The channel to join.
 * @returns {boolean} - True if the member can join, false otherwise.
 */
async function checkJoinPermission(member, channel) {
  if (!channel) return true;

  const channelDoc = await JoinToSystem.findOne({ channelId: channel.id });
  if (!channelDoc) return true;

  if (channelDoc.isLocked) {
    const isOwner = channelDoc.ownerId === member.id;
    const hasAdminPermission =
      channel.permissionsFor(member)?.has(PermissionFlagsBits.Administrator) ??
      false;
    const isAllowed = channelDoc.allowedUsers?.includes(member.id) ?? false;

    if (!isOwner && !hasAdminPermission && !isAllowed) return false;
  }

  if (channelDoc.userLimit > 0 && channel.members.size >= channelDoc.userLimit)
    return false;

  return true;
}
