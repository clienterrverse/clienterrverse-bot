import { ChannelType, PermissionFlagsBits } from 'discord.js';
import JoinToSystem from '../../schemas/joinToSystemSchema.js';
import JoinToSystemSetup from '../../schemas/joinToSystemSetup.js';
import createVoiceChannel from '../../utils/join-to-system/createVoiceChannel.js';

/**
 * @param {import('discord.js').Client} client
 * @param {{ handleError: Function }} errorHandler
 * @param {import('discord.js').VoiceState} oldState
 * @param {import('discord.js').VoiceState} newState
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

async function handleMove(oldState, newState) {
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

async function checkJoinPermission(member, channel) {
   const channelDoc = await JoinToSystem.findOne({ channelId: channel.id });
   if (!channelDoc) return true;

   if (channelDoc.isLocked) {
      const isOwner = channelDoc.ownerId === member.id;
      const hasAdminPermission =
         channel
            .permissionsFor(member)
            ?.has(PermissionFlagsBits.Administrator) ?? false;
      const isAllowed = channelDoc.allowedUsers?.includes(member.id) ?? false;

      if (!isOwner && !hasAdminPermission && !isAllowed) return false;
   }

   if (channelDoc.userLimit > 0 && channel.members.size >= channelDoc.userLimit)
      return false;

   return true;
}
