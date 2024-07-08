import { model, Schema } from 'mongoose';

const urlSchema = new Schema(
   {
      ID: { type: String, required: true },
      userID: { type: String, required: true },
      link: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      status: {
         type: String,
         enum: ['open', 'closed', 'locked'],
         default: 'open',
      },
   },
   {
      strict: false,
      timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
   }
);

export default model('Url', urlSchema);
