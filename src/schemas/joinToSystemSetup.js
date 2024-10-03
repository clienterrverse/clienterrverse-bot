import mongoose from 'mongoose';

const joinToSystemSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
  },
  joinToCreateChannelId: {
    type: String,
    required: true,
  },
  controlChannelId: {
    type: String,
    required: true,
  },
  categoryId: {
    type: String,
    required: true,
  },
});

const JoinToSystem = mongoose.model('JoinToSystem', joinToSystemSchema);

export default JoinToSystem;
