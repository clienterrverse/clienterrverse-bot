import mongoose from 'mongoose';

const userPrefixSchema = new mongoose.Schema({
   userId: {
      type: String,
      required: true,
   },
   prefix: {
      type: String,
      default: '!',
   },
   exemptFromPrefix: {
      type: Boolean,
      default: false,
   },
});

export const UserPrefix = mongoose.model('UserPrefixs', userPrefixSchema);
