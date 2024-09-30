import { ChannelType, PermissionFlagsBits } from 'discord.js';
import JoinToSystemChannel from '../../schemas/joinToSystemSchema.js';
import JoinToSystem from '../../schemas/joinToSystemSetup.js';

async function createVoiceChannel(member, guild, client, options = {}) {
  try {
    const setup = await JoinToSystem.findOne({ guildId: guild.id });
    if (!setup) {
      throw new Error('Join-to-Create system is not set up for this guild.');
    }

    const {
      nameTemplate = "${username}'s Channel",
      userLimit = 0,
      bitrate = 64000,
      rtcRegion = null,
    } = { ...setup.defaultChannelSettings, ...options };

    const channelName = nameTemplate.replace(
      /\${username}/g,
      member.user.username
    );

    const newChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildVoice,
      parent: setup.categoryId,
      userLimit,
      bitrate,
      rtcRegion,
      permissionOverwrites: [
        {
          id: guild.id,
          allow: [PermissionFlagsBits.Connect],
        },
        {
          id: member.id,
          allow: [
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.MoveMembers,
          ],
        },
      ],
    });

    // Check if a channel with this ID already exists
    let channelDoc = await JoinToSystemChannel.findOne({
      channelId: newChannel.id,
    });

    if (channelDoc) {
      // If it exists, update it
      channelDoc.name = channelName;
      channelDoc.ownerId = member.id;
      channelDoc.userLimit = userLimit;
      channelDoc.bitrate = bitrate;
      channelDoc.rtcRegion = rtcRegion;
    } else {
      // If it doesn't exist, create a new one
      channelDoc = new JoinToSystemChannel({
        guildId: guild.id,
        channelId: newChannel.id,
        ownerId: member.id,
        name: channelName,
        userLimit,
        bitrate,
        rtcRegion,
      });
    }

    await channelDoc.save();

    if (member.voice.channel) {
      await member.voice.setChannel(newChannel);
    }

    return newChannel;
  } catch (error) {
    console.error('Error creating voice channel:', error);

    if (error.code === 11000) {
      // Duplicate key error, try updating the existing document
      try {
        const existingChannelDoc = await JoinToSystemChannel.findOne({
          channelId: error.keyValue.channelId,
        });

        if (existingChannelDoc) {
          existingChannelDoc.name = `${member.user.username}'s Channel`;
          existingChannelDoc.ownerId = member.id;
          existingChannelDoc.userLimit = options.userLimit || 0;
          existingChannelDoc.bitrate = options.bitrate || 64000;
          existingChannelDoc.rtcRegion = options.rtcRegion || null;

          await existingChannelDoc.save();
          console.log(
            'Updated existing channel document due to duplicate key error.'
          );

          if (member.voice.channel) {
            await member.voice.setChannel(existingChannelDoc.channelId);
          }

          return existingChannelDoc.channelId;
        }
      } catch (updateError) {
        console.error('Error updating existing channel document:', updateError);
      }
    }
    throw error;
  }
}

export default createVoiceChannel;
