import { model, Schema } from 'mongoose';
const urlSchema = new Schema(
   {
      ID: { type: String, required: true, unique: true },
      userID: { type: String, required: true },
      originalURL: { type: String, required: true }, // Store the original URL
      shortURL: { type: String, required: true, unique: true }, // Store the shortened URL
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }, // Track when the URL was last updated
      status: {
         type: String,
         enum: ['open', 'closed', 'locked'],
         default: 'open',
      },
      expiresAt: { type: Date }, // Optional: When the URL should expire
   },
   {
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
   }
);
export default model('Url', urlSchema);
