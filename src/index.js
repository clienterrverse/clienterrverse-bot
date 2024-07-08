/** @format */

import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import DiscordBotErrorHandler from './handlers/errorHandler.js';

// Function to check environment variables
const checkEnvVariables = () => {
   if (!process.env.TOKEN) {
      console.error(
         'ERROR: TOKEN is not defined in the environment variables.'
      );
      process.exit(1);
   }
   if (!process.env.MONGODB_TOKEN) {
      console.error(
         'ERROR: MONGODB_TOKEN is not defined in the environment variables.'
      );
      process.exit(1);
   }
   if (!process.env.GITHUB_TOKEN) {
      console.error(
         'ERROR: GITHUB_TOKEN is not defined in the environment variables.'
      );
      process.exit(1);
   }
};

// Main function to set up and start the Discord client
const main = async () => {
   checkEnvVariables();

   // Import the event handler dynamically
   let eventHandler;
   try {
      const module = await import('./handlers/eventHandler.js');
      eventHandler = module.default;
   } catch (error) {
      console.error('ERROR: Failed to import event handler:', error);
      process.exit(1);
   }

   // Create a new Discord client with the necessary intents
   const client = new Client({
      intents: [
         GatewayIntentBits.Guilds,
         GatewayIntentBits.GuildMembers,
         GatewayIntentBits.GuildMessages,
         GatewayIntentBits.MessageContent,
         GatewayIntentBits.DirectMessages,
      ],
   });

   const errorHandler = new DiscordBotErrorHandler({
      webhookUrl: process.env.ERROR_WEBHOOK_URL,
   });

   // Handle events using the imported event handler
   try {
      eventHandler(client, errorHandler);
   } catch (error) {
      console.error('ERROR: Failed to set up event handler:', error);
      process.exit(1);
   }

   // Attempt to log in to Discord with the provided token
   try {
      errorHandler.initialize(client);
      await client.login(process.env.TOKEN);
   } catch (error) {
      console.error('ERROR: Logging into Discord failed:', error);
      process.exit(1);
   }
};

main();
