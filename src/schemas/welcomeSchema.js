import mongoose from 'mongoose';

const welcomeSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  enabled: { type: Boolean, default: false },
  channelId: { type: String, default: null },
  roleId: { type: String, default: null },
  message: { type: String, default: 'Welcome {user} to the server!' },
});

export default mongoose.model('Welcome', welcomeSchema);
