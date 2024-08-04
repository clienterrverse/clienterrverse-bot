import 'colors';
import mongoose from 'mongoose';
import { ActivityType } from 'discord.js';

const mongoURI = process.env.MONGODB_TOKEN;

export default async (client, errorHandler) => {
   try {
      console.log(`${client.user.username} is online.`.blue);

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

      if (!mongoURI) {
         console.log(
            'MongoDB URI not found. Skipping MongoDB connection.'.yellow
         );
         return;
      }

      mongoose.set('strictQuery', true);

      await mongoose.connect(mongoURI, {
         serverSelectionTimeoutMS: 15000,
      });

      console.log('Connected to the MongoDB database'.green);
   } catch (error) {
      errorHandler.handleError(error, { type: 'mongodbConnection' });
      console.error(`Error connecting to MongoDB: ${error.message}`.red);
   }
};
