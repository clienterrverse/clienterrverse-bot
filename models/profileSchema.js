const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  userId: { type: String, require: true, unique: true },
  serverId: { type: String, require: true },
  ClienterrCoins: { type: Number, default: 10 },
});

const model = mongoose.model("Clienterrverse_economy", profileSchema);

module.exports = model;
