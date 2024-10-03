import mongoose from 'mongoose';

const joinToSystemChannelSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
    },
    channelId: {
      type: String,
      required: true,
    },
    ownerId: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
      default: 'Unnamed Channel',
    },
    userLimit: {
      type: Number,
      default: 0,
      min: 0,
      max: 99,
    },
    bitrate: {
      type: Number,
      default: 64000,
      min: 8000,
      max: 384000,
    },
    rtcRegion: {
      type: String,
      default: null,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
    allowedRoles: [
      {
        type: String,
      },
    ],
    allowedUsers: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const JoinToSystemChannel = mongoose.model(
  'JoinToSystemChannel',
  joinToSystemChannelSchema
);

export default JoinToSystemChannel;
