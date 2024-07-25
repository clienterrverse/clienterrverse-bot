import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';
import DiscordBotErrorHandler from './handlers/errorHandler.ts';
const requiredEnvVars = ['TOKEN', 'MONGODB_TOKEN', 'GITHUB_TOKEN', 'ERROR_WEBHOOK_URL'];

const checkEnvVariables = () => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error(`ERROR: The following environment variables are not defined: ${missingVars.join(', ')}`);
    process.exit(1);
  }
};

const createClient = () => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildVoiceStates,
    ],
  });
};

const setupErrorHandler = (client: Client) => {
  const errorHandler = new DiscordBotErrorHandler({
    webhookUrl: process.env.ERROR_WEBHOOK_URL!,
  });
  errorHandler.initialize(client);
  return errorHandler;
};

const main = async () => {
  checkEnvVariables();

  const client = createClient();
  const errorHandler = setupErrorHandler(client);

  try {
    const { default: eventHandler } = await import('./handlers/eventHandler.js');
    eventHandler(client, errorHandler);
  } catch (error) {
    console.error('ERROR: Failed to import or set up event handler:', error);
    process.exit(1);
  }

  try {
    await client.login(process.env.TOKEN);
    console.log('Bot successfully logged in');
  } catch (error) {
    console.error('ERROR: Logging into Discord failed:', error);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});