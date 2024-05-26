import { Schema, model } from 'mongoose';

const profileSchema = new Schema({
  userId: { type: String, require: true, unique: true },
  serverId: { type: String, require: true },
  ClienterrCoins: { type: Number, default: 10 },
  dailyLastUsed: { type: Number, default: 0 },
  coinFlipLastUsed: { type: Number, default: 0 },
});

export default model("clienterrversedb", profileSchema);

