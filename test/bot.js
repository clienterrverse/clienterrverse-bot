import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
   console.log('Ready!');

   try {
      // Fetch all commands
      const commands = await client.application.commands.fetch();

      // Loop through each command and delete it
      for (const command of commands.values()) {
         await client.application.commands.delete(command.id);
         console.log(`Deleted command: ${command.name}`);
      }

      console.log('All commands deleted.');
   } catch (error) {
      console.error('Error deleting commands:', error);
   }

   // Close the bot after deleting commands
   client.destroy();
});

// Login to Discord with your client's token
client.login('');
