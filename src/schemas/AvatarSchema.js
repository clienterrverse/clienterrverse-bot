import mongoose from 'mongoose';

// Avatar Schema
const AvatarSchema = new mongoose.Schema({
   userId: { type: String, required: true },
   guildId: { type: String, required: true },
   avatarUrl: { type: String, required: true },
   timestamp: { type: Date, default: Date.now },
   isGlobal: { type: Boolean, default: true },
});

// Avatar Rating Schema
const AvatarRatingSchema = new mongoose.Schema({
   avatarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Avatar',
      required: true,
   },
   raterId: { type: String, required: true },
   rating: { type: Number, min: 1, max: 5, required: true },
   timestamp: { type: Date, default: Date.now },
});

// Avatar Challenge Schema
const AvatarChallengeSchema = new mongoose.Schema({
   guildId: { type: String, required: true },
   title: { type: String, required: true },
   description: { type: String },
   startDate: { type: Date, required: true },
   endDate: { type: Date, required: true },
   participants: [{ type: String }], // Array of user IDs
   winner: { type: String },
});

// Create models
const Avatar = mongoose.model('Avatar', AvatarSchema);
const AvatarRating = mongoose.model('AvatarRating', AvatarRatingSchema);
const AvatarChallenge = mongoose.model(
   'AvatarChallenge',
   AvatarChallengeSchema
);

export { Avatar, AvatarRating, AvatarChallenge };
