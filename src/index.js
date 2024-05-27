import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';


if (!process.env.TOKEN) {
  console.error("TOKEN is not defined in the environment variables");
  process.exit(1);
}

(async () => {
  const { default: eventHandler } = await import('./handlers/eventHandler.js');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildInvites,
    ],
  });
  await eventHandler(client);

  try {
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error('Error logging in:', error);
    process.exit(1);
  }
  
})();