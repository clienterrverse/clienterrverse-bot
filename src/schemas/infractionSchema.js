import mongoose from 'mongoose';

const infractionSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  infractionId: { type: String, required: true },
  userId: { type: String, required: true },
  user: { type: String, required: true },
  moderatorId: { type: String, required: true },
  moderator: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["Ban", "Mute", "Warn", "Unmute", "Unban"],
  },
  reason: { type: String, required: true },
  date: { type: String, required: true },
  expires: { type: String, required: false },
  active: { type: Boolean, required: false },
  duration: { type: Number, required: false },
  issued: { type: Date, default: Date.now },
});

const Infraction = mongoose.model('Infraction', infractionSchema);

export { Infraction };
