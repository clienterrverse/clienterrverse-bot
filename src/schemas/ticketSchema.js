import { model, Schema } from 'mongoose';

const ticketSchema = new Schema({
  guildID: { type: String, required: true },
  ticketMemberID: { type: String, required: true },
  ticketChannelID: { type: String, required: true },
  parentTicketChannelID: { type: String, required: true },
  closed: { type: Boolean, default: false },
  membersAdded: { type: [String], default: [] },
  claimedBy: { type: String, default: null }, // ID of the member who claimed the ticket
  createdAt: { type: Date, default: Date.now }, // Timestamp of ticket creation
  status: { type: String, enum: ['open', 'closed', 'locked'], default: 'open' }, // Ticket status
  actionLog: { type: [String], default: [] }, // Log of actions taken on the ticket
}, {
  strict: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
});

export default model('Ticket', ticketSchema);
