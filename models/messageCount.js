const mongoose = require("mongoose");

const messageCountSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  guildId: {
    type: String,
    required: true,
  },
  messageCount: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model("MessageCount", messageCountSchema);
