/** @format */

/**
 * Import required modules and configure the environment.
 * @requires dotenv/config
 * @requires discord.js
 * @requires ./handlers/errorHandler
 */
import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import DiscordBotErrorHandler from './handlers/errorHandler.js';
// @ts-check

/**
 * Checks if all required environment variables are defined.
 * If any are missing, it logs an error message and exits the process.
 * @throws {Error} If any environment variable is missing.
 */
const checkEnvVariables = () => {
  if (!process.env.TOKEN) {
    console.error('ERROR: TOKEN is not defined in the environment variables.');
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

/**
 * The main function that initializes the Discord bot.
 * It checks environment variables, sets up the event handler, and logs into Discord.
 * @async
 * @throws {Error} If any step of the initialization process fails.
 */
const main = async () => {
  checkEnvVariables();
  let eventHandler;
  try {
    // Dynamically imports the event handler module
    const module = await import('./handlers/eventHandler.js');
    eventHandler = module.default;
  } catch (error) {
    console.error('ERROR: Failed to import event handler:', error);
    process.exit(1);
  }

  // Creates a new Discord client with the necessary intents
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

  // Initializes the error handler with the error webhook URL
  const errorHandler = new DiscordBotErrorHandler({
    webhookUrl: process.env.ERROR_WEBHOOK_URL,
  });

  try {
    // Sets up the event handler for the client
    eventHandler(client, errorHandler);
  } catch (error) {
    console.error('ERROR: Failed to set up event handler:', error);
    process.exit(1);
  }

  try {
    // Initializes the error handler and logs the client into Discord
    errorHandler.initialize(client);
    client.errorHandler = errorHandler;

    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('ERROR: Logging into Discord failed:', error);
    process.exit(1);
  }
};

// Calls the main function and catches any unhandled errors
main().catch((error) => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});
