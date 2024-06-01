import { model, Schema } from 'mongoose';

const ticketSetupSchema = new Schema({
  guildID: String,
  feedbackChannelID: String,
  ticketChannelID: String,
  staffRoleID: String,
  ticketType: String,
}, {
  strict: false
});

export default model('ticketSetup', ticketSetupSchema);
