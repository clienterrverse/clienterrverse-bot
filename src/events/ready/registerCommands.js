import 'colors';
import path from 'path'; // Import the path module
import commandComparing from '../../utils/commandComparing.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import config from '../../config/config.json' assert { type: 'json' };
import { ApplicationCommandType } from 'discord.js';

export default async (client) => {
  try {
    const { testServerId } = config;
    const localCommands = await getLocalCommands();
    const applicationCommands = await getApplicationCommands(client, testServerId);

    // Create a set of local command names for quick lookup
    const localCommandNames = new Set(localCommands.map(cmd => cmd.data.name));

    // Filter out context menus from the deletion process
    const applicationCommandsToDelete = applicationCommands.cache.filter(cmd =>
      cmd.type === ApplicationCommandType.ChatInput && !localCommandNames.has(cmd.name)
    );

    // Delete application commands not present in local commands and of type ChatInput
    await Promise.all(applicationCommandsToDelete.map(async (applicationCommand) => {
      try {
        await applicationCommands.delete(applicationCommand.id);
        console.log(`[${new Date().toISOString()}] Application command ${applicationCommand.name} has been deleted because it was not found in local commands.`.red);
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to delete application command ${applicationCommand.name}: ${err.message}`.red);
      }
    }));

    // Register or update local commands
    await Promise.all(localCommands.map(async (localCommand) => {
      const { data } = localCommand;
      const commandName = data.name;
      const commandDescription = data.description;
      const commandOptions = data.options;

      const existingCommand = applicationCommands.cache.find(cmd => cmd.name === commandName);

      try {
        if (existingCommand) {
          if (localCommand.deleted) {
            await applicationCommands.delete(existingCommand.id);
            console.log(`[${new Date().toISOString()}] Application command ${commandName} has been deleted.`.red);
          } else if (commandComparing(existingCommand, localCommand)) {
            await applicationCommands.edit(existingCommand.id, {
              name: commandName,
              description: commandDescription,
              options: commandOptions,
            });
            console.log(`[${new Date().toISOString()}] Application command ${commandName} has been edited.`.yellow);
          }
        } else if (!localCommand.deleted) {
          await applicationCommands.create({
            name: commandName,
            description: commandDescription,
            options: commandOptions,
          });
          console.log(`[${new Date().toISOString()}] Application command ${commandName} has been registered.`.green);
        } else {
          console.log(`[${new Date().toISOString()}] Application command ${commandName} has been skipped, since property "deleted" is set to "true".`.grey);
        }
      } catch (err) {
        console.error(`[${new Date().toISOString()}] Failed to process application command ${commandName}: ${err.message}`.red);
      }
    }));
  } catch (err) {
    console.error(`[${new Date().toISOString()}] An error occurred while registering commands: ${err.message}`.red);
  }
};
