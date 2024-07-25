/** @format */

import mongoose from 'mongoose';

/** @format
 * Schema for user balances
 * This schema stores the balance information for each user, including their wallet and bank balances, as well as timestamps for various cooldowns.
 */
const balanceSchema = new mongoose.Schema(
   {
      userId: { type: String, required: true, unique: true, index: true },
      balance: { type: Number, default: 0 },
      bank: { type: Number, default: 0 },
      lastDaily: { type: Date, default: null },
      lastWeekly: { type: Date, default: null },
      lastHourly: { type: Date, default: null },
      lastBeg: { type: Date, default: null },
      lastCoin: { type: Date, default: null },
      lastWork: { type: Date, default: null },
      lastCrime: { type: Date, default: null },
      lastSlots: { type: Date, default: null },
   },
   { timestamps: true }
);

/** @format
 * Schema for transactions
 * This schema tracks all transactions made by users, including deposits, withdrawals, and transfers. Each transaction has a type, amount, date, and optional description.
 */
const transactionSchema = new mongoose.Schema(
   {
      userId: { type: String, required: true, index: true },
      type: { type: String, required: true }, // e.g., deposit, withdraw, transfer
      amount: { type: Number, required: true, min: 0 },
      date: { type: Date, default: Date.now },
      description: { type: String, default: '' },
   },
   { timestamps: true }
);

/** @format
 * Schema for items
 * This schema defines the structure for items that can be created, with properties such as itemId, name, price, description, emoji, and category.
 */
const itemSchema = new mongoose.Schema(
   {
      itemId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 },
      description: { type: String, default: '' },
      emoji: { type: String, default: '❔' },
      category: { type: String, default: 'misc' },
   },
   { timestamps: true }
);

/** @format
 * Schema for user inventory
 * This schema manages the inventory of items each user possesses, including item IDs and their quantities.
 */
const inventorySchema = new mongoose.Schema(
   {
      userId: { type: String, required: true, index: true },
      items: [
         {
            itemId: { type: String, required: true },
            quantity: { type: Number, default: 1, min: 1 },
         },
      ],
   },
   { timestamps: true }
);

/** @format
 * Schema for quests
 * This schema handles quests that users can undertake, including quest ID, name, description, reward, and the user ID of the developer who created the quest.
 */
const questSchema = new mongoose.Schema(
   {
      questId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      description: { type: String, required: true },
      reward: { type: Number, required: true },
      createdBy: { type: String, required: true }, // User ID of the developer who created the quest
   },
   { timestamps: true }
);

const Quest = mongoose.model('Quest', questSchema);

/** @format
 * Create models
 * These models are created from their respective schemas and can be used to interact with the MongoDB database.
 */
const Balance = mongoose.model('Balance', balanceSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);
const Item = mongoose.model('Item', itemSchema);
const Inventory = mongoose.model('Inventory', inventorySchema);

/** @format
 * Export models
 * These models are exported for use in other parts of the application.
 */
export { Balance, Transaction, Item, Inventory, Quest };
