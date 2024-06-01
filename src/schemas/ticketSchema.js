import { model, Schema } from 'mongoose';

const ticketSchema = new Schema({
    guildID: String,
    ticketMemberID: String,
    ticketChannelID: String,
    parentTicketChannelID: String,
    rating: Number,
    feedback: String,
    closed: Boolean, // Fixed from 'close' to 'closed' to match the command file
    membersAdded: Array, // Fixed from 'memberAdded' to 'membersAdded' to match the command file
}, {
    strict: false
});

export default model('Ticket', ticketSchema); 
