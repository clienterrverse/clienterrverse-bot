import mongoose from 'mongoose';

// Schema for stocks
const stockSchema = new mongoose.Schema(
   {
      stockId: { type: String, required: true, unique: true },
      name: { type: String, required: true },
      description: { type: String, default: '' },
      price: { type: Number, required: true },
      lastUpdated: { type: Date, default: Date.now },
   },
   { timestamps: true }
);

// Schema for user investments
const investmentSchema = new mongoose.Schema(
   {
      userId: { type: String, required: true, index: true },
      stockId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      purchasePrice: { type: Number, required: true },
      purchaseDate: { type: Date, default: Date.now },
   },
   { timestamps: true }
);

// Create models
const Stock = mongoose.model('Stock', stockSchema);
const Investment = mongoose.model('Investment', investmentSchema);

// Export models
export { Stock, Investment };
