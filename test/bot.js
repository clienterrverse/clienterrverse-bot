import 'dotenv/config';
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once('ready', async () => {
   console.log('Ready!');

   try {
      // Get  all commands
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

   // Close the bot
   client.destroy();
});

client.login(process.env.TOKEN);
