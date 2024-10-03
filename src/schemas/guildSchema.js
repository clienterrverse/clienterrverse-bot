/** @format */

import mongoose from 'mongoose';
const guildSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    leaderId: { type: String, required: true },
    members: [
      {
        userId: String,
        role: {
          type: String,
          enum: ['member', 'officer', 'leader'],
          default: 'member',
        },
        joinDate: { type: Date, default: Date.now },
      },
    ],
    pendingMembers: [
      {
        userId: String,
        ign: String,
        reason: String,
        messageId: String,
        appliedDate: { type: Date, default: Date.now },
      },
    ],
    creationDate: { type: Date, default: Date.now },
    level: { type: Number, default: 1 },
    description: String,
    tags: [String],
    maxMembers: { type: Number, default: 50 },
  },
  { timestamps: true }
);
export default mongoose.model('Guild', guildSchema);
