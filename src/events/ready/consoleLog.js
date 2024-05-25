import 'colors';
import mongoose from 'mongoose';
import { ActivityType } from 'discord.js';

const mongoURI = process.env.MONGODB_TOKEN;

export default async (client) => {
  try {
    client.user.setActivity("Clienterrverse", {
      type: ActivityType.Competing,
    });

    console.log(`${client.user.username} is online.`.blue);

    if (!mongoURI) {
      console.log('MongoDB URI not found. Skipping MongoDB connection.'.yellow);
      return;
    }

    // Configure mongoose to use strict query mode
    mongoose.set("strictQuery", true);
    await mongoose.connect(mongoURI);

    console.log(`Connected to the MongoDB database.`.green);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`.red);
  }
};
