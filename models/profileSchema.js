const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: { type: String, require: true, unique: true },
  serverId: { type: String, require: true },
  ClienterrCoins: { type: Number, default: 10 },
  dailyLastUsed: { type: Number, default: 0 },
  coinFlipLastUsed: { type: Number, default: 0 },
});

const model = mongoose.model("clienterrversedb", profileSchema);

module.exports = model;
