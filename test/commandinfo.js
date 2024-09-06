import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';
import { SlashCommandBuilder } from '@discordjs/builders';
import { Client, GatewayIntentBits } from 'discord.js';

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

/**
 * Fetches a command by its name or ID from the application's command list.
 * @param {string} commandNameOrId - The name or ID of the command to fetch.
 * @param {object} client - The Discord client instance.
 * @returns {object|null} The command object if found, otherwise null.
 * @throws {Error} If there's an error during the fetching process.
 */
async function fetchCommand(commandNameOrId, client) {
   try {
      // Fetch all application commands
      const applicationCommands = await client.application.commands.fetch();

      // Filter to find the command by name or ID
      const filteredCommand = applicationCommands.find(
         (cmd) => cmd.name === commandNameOrId || cmd.id === commandNameOrId
      );

      // Return the filtered command or null if not found
      return filteredCommand || null;
   } catch (error) {
      console.error(`Error fetching commands: ${error}`);
      throw error;
   }
}

// Example usage of the fetchCommand function
(async () => {
   try {
      await client.login(process.env.TOKEN);

      const commandNameOrId = 'triggered';
      const command = await fetchCommand(commandNameOrId, client);

      if (command) {
         console.log(`Command found: ${command.name}`);
         console.log(command);
      } else {
         console.log('Command not found.');
      }
      client.destroy();
   } catch (error) {
      console.error('Error:', error);
   }
})();
