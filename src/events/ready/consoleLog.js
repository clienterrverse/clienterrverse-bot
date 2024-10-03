/**
 * Handles the ready event for the Discord client, sets the client's presence, and connects to the MongoDB database.
 *
 * @param {Discord.Client} client - The Discord client instance.
 * @param {errorHandler} errorHandler - The error handler function to handle any errors that occur.
 */
import 'colors';
import mongoose from 'mongoose';
import { ActivityType } from 'discord.js';

const mongoURI = process.env.MONGODB_TOKEN;

export default async (client, errorHandler) => {
  try {
    console.log(`${client.user.username} is online.`.blue);

    // Sets the client's presence to streaming with a specific activity.
    client.user.setPresence({
      activities: [
        {
          name: 'Clienterrverse',
          type: ActivityType.Streaming,
          url: 'https://www.youtube.com/watch?v=KXan_-lBt-8',
        },
      ],
      status: 'online',
    });

    // Checks if the MongoDB URI is set in the environment variables.
    if (!mongoURI) {
      console.log('MongoDB URI not found. Skipping MongoDB connection.'.yellow);
      return;
    }

    // Sets the mongoose strictQuery option to true for better error handling.
    mongoose.set('strictQuery', true);

    // Connects to the MongoDB database with a timeout for server selection.
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 15000,
    });

    console.log('Connected to the MongoDB database'.green);
  } catch (error) {
    // Handles any errors that occur during the MongoDB connection process.
    errorHandler.handleError(error, { type: 'mongodbConnection' });
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
  }
};
