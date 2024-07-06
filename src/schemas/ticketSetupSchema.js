import { model, Schema } from 'mongoose';

const ticketSetupSchema = new Schema(
  {
    guildID: String,
    ticketChannelID: String,
    staffRoleID: String,
    ticketType: String,
    categoryID: String, // New field for the category ID
    logChannelID: String, // New field for the log channel ID
  },
  {
    strict: false,
  }
);

export default model('ticketSetup', ticketSetupSchema);
