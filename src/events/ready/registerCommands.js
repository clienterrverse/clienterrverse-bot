import 'colors';
import path from 'path';
import commandComparing from '../../utils/commandComparing.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import { config } from '../../config/config.js';
import { ApplicationCommandType } from 'discord.js';

/**
 * Registers, updates, or deletes application commands based on local command files.
 * 
 * This script should be run to sync your application's commands with the local commands.
 * 
 * @param {Client} client - The Discord client instance.
 */
export default async (client) => {
  try {
    const { testServerId } = config;
    const localCommands = await getLocalCommands();
    const applicationCommands = await getApplicationCommands(client, testServerId);

    // Create a set of local command names for quick lookup
    const localCommandNames = new Set(localCommands.map(cmd => cmd.data.name));

    // Filter out context menus and gather commands to delete
    const commandsToDelete = applicationCommands.cache.filter(cmd =>
      cmd.type === ApplicationCommandType.ChatInput && !localCommandNames.has(cmd.name)
    );

    // Delete application commands not present in local commands and of type ChatInput
    await Promise.all(commandsToDelete.map(async (cmd) => {
      try {
        await applicationCommands.delete(cmd.id);
        console.log(`[${new Date().toISOString()}] Deleted command: ${cmd.name}`.red);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to delete command ${cmd.name}: ${err.message}`.red);
      }
    }));

    // Register or update local commands
    await Promise.all(localCommands.map(async (localCommand) => {
      const { data } = localCommand;
      const commandName = data.name;

      const existingCommand = applicationCommands.cache.find(cmd => cmd.name === commandName);

      try {
        if (existingCommand) {
          if (localCommand.deleted) {
            await applicationCommands.delete(existingCommand.id);
            console.log(`[${new Date().toISOString()}] Deleted command (marked as deleted): ${commandName}`.red);
          } else if (commandComparing(existingCommand, localCommand)) {
            await applicationCommands.edit(existingCommand.id, {
              name: commandName,
              description: data.description,
              options: data.options,
            });
            console.log(`[${new Date().toISOString()}] Updated command: ${commandName}`.yellow);
          }
        } else if (!localCommand.deleted) {
          await applicationCommands.create({
            name: commandName,
            description: data.description,
            options: data.options,
          });
          console.log(`[${new Date().toISOString()}] Registered new command: ${commandName}`.green);
        } else {
          console.log(`[${new Date().toISOString()}] Skipped command (marked as deleted): ${commandName}`.grey);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to process command ${commandName}: ${err.message}`.red);
      }
    }));
  } catch (err) {
    console.error(`[${new Date().toISOString()}] Error during command sync: ${err.message}`.red);
  }
};
