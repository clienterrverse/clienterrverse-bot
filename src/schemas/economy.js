/** @format */

import mongoose from 'mongoose';

// Schema for user balances
const balanceSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  bank: { type: Number, default: 0 },
  lastDaily: { type: Date, default: null },
  lastHourly: { type: Date, default: null },
  lastBeg: { type: Date, default: null },
  lastWork: { type: Date, default: null },
  lastCrime: { type: Date, default: null },
});

// Schema for transactions
const transactionSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true }, // e.g., deposit, withdraw, transfer
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String, default: '' },
});

// Schema for items
const itemSchema = new mongoose.Schema({
  itemId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, default: '' },
  category: { type: String, default: 'misc' },
});

// Schema for user inventory
const inventorySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  items: [
    {
      itemId: { type: String, required: true },
      quantity: { type: Number, default: 1 },
    },
  ],
});

// Create models
const Balance = mongoose.model('Balance', balanceSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Item = mongoose.model('Item', itemSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);

// Export models
export { Balance, Transaction, Item, Inventory };
