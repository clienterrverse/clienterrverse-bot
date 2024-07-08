import 'colors';
import mongoose from 'mongoose';
import { ActivityType } from 'discord.js';

const mongoURI = process.env.MONGODB_TOKEN;

export default async (client) => {
  try {
    console.log(`${client.user.username} is online.`.blue);

    client.user.setPresence({
      activities: [
        {
          name: 'Clienterring in Clienterrverse',
          type: ActivityType.Competing,
          url: 'https://clienterr.com',
        },
      ],
      status: 'online',
    });

    if (!mongoURI) {
      console.log('MongoDB URI not found. Skipping MongoDB connection.'.yellow);
      return;
    }

    mongoose.set('strictQuery', true);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 15000,
    });

    console.log('Connected to the MongoDB database'.green);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
  }
};
