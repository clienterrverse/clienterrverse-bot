import { PermissionFlagsBits } from 'discord.js';
import JoinToSystemChannel from '../../schemas/joinToSystemChannel.js';

async function deleteVoiceChannel(channel, user) {
  try {
    // Fetch the channel document from the database
    const channelDoc = await JoinToSystemChannel.findOne({
      channelId: channel.id,
    });

    if (!channelDoc) {
      throw new Error('This channel is not part of the Join-to-Create system.');
    }

    // Check if the user is the owner or has admin permissions
    const isOwner = channelDoc.ownerId === user.id;
    const hasAdminPermission =
      channel.permissionsFor(user)?.has(PermissionFlagsBits.Administrator) ??
      false;

    if (!isOwner && !hasAdminPermission) {
      throw new Error('You do not have permission to delete this channel.');
    }

    // Delete the channel
    await channel.delete();

    // Remove the channel document from the database
    const result = await JoinToSystemChannel.deleteOne({
      channelId: channel.id,
    });

    if (result.deletedCount === 0) {
      console.warn(
        `Channel document for ${channel.id} was not found in the database during deletion.`
      );
    }

    return true;
  } catch (error) {
    console.error('Error deleting voice channel:', error);
    throw error;
  }
}

export default deleteVoiceChannel;
