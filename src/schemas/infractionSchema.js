import mongoose from 'mongoose';

const infractionSchema = new mongoose.Schema(
   {
      guildId: { type: String, required: true },
      infractionId: { type: String, required: true },
      userId: { type: String, required: true },
      moderatorId: { type: String, required: true },
      type: { type: String, required: true },
      reason: { type: String, required: true },
      date: { type: String, required: true },
      expires: { type: String, required: true },
   },
   { timestamps: true }
);

// Create models
const Infraction = mongoose.model('Infraction', infractionSchema);

// Export models
export { Infraction };
