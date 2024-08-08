/** @format */

import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import DiscordBotErrorHandler from './handlers/errorHandler.js';
// @ts-check

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

const main = async () => {
   checkEnvVariables();
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
         GatewayIntentBits.GuildVoiceStates,
      ],
   });

   const errorHandler = new DiscordBotErrorHandler({
      webhookUrl: process.env.ERROR_WEBHOOK_URL,
   });

   try {
      eventHandler(client, errorHandler);
   } catch (error) {
      console.error('ERROR: Failed to set up event handler:', error);
      process.exit(1);
   }

   try {
      errorHandler.initialize(client);
      client.errorHandler = errorHandler;

      await client.login(process.env.TOKEN);
   } catch (error) {
      console.error('ERROR: Logging into Discord failed:', error);
      process.exit(1);
   }
};

main().catch((error) => {
   console.error('Unhandled error in main function:', error);
   process.exit(1);
});
