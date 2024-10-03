import { model, Schema } from 'mongoose';

const ticketSetupSchema = new Schema(
  {
    guildID: String,
    ticketChannelID: String,
    staffRoleID: String,
    ticketType: String,
    categoryID: String,
    logChannelID: String,
    messageID: String,
    customOptions: [
      {
        label: String,
        value: String,
        description: String,
      },
    ],
  },
  {
    strict: false,
  }
);

export default model('ticketSetup', ticketSetupSchema);
