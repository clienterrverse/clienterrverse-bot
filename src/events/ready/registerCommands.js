import 'colors';
import { ApplicationCommandType } from 'discord.js';
import { config } from '../../config/config.js';
import commandComparing from '../../utils/commandComparing.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';
import getLocalCommands from '../../utils/getLocalCommands.js';

/**
 * Registers, updates, or deletes application commands based on local command files.
 * @param {Client} client - The Discord client instance.
 */
export default async (client, errorHandler) => {
   try {
      const { testServerId } = config;
      const [localCommands, applicationCommands] = await Promise.all([
         getLocalCommands(),
         getApplicationCommands(client, testServerId),
      ]);

      await deleteUnusedCommands(applicationCommands, localCommands);
      await updateOrCreateCommands(applicationCommands, localCommands);
   } catch (err) {
      console.error(
         `[${new Date().toISOString()}] Error during command sync: ${err.message}`
            .red
      );
   }
};

/**
 * Deletes unused commands from the application.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Array} localCommands - The local commands.
 */
async function deleteUnusedCommands(applicationCommands, localCommands) {
   const localCommandNames = new Set(localCommands.map((cmd) => cmd.data.name));
   const commandsToDelete = applicationCommands.cache.filter(
      (cmd) =>
         cmd.type === ApplicationCommandType.ChatInput &&
         !localCommandNames.has(cmd.name)
   );

   await Promise.all(commandsToDelete.map(deleteCommand(applicationCommands)));
}

/**
 * Updates existing commands or creates new ones based on local command files.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Array} localCommands - The local commands.
 */
async function updateOrCreateCommands(applicationCommands, localCommands) {
   await Promise.all(localCommands.map(processCommand(applicationCommands)));
}

/**
 * Deletes a command from the application.
 * @param {Collection} applicationCommands - The current application commands.
 * @returns {Function} The delete command function.
 */
const deleteCommand = (applicationCommands) => async (cmd) => {
   try {
      await applicationCommands.delete(cmd.id);
      console.log(
         `[${new Date().toISOString()}] Deleted command: ${cmd.name}`.red
      );
   } catch (err) {
      console.error(
         `[${new Date().toISOString()}] Failed to delete command ${cmd.name}: ${err.message}`
            .red
      );
   }
};

/**
 * Processes a local command, updating or creating it as needed.
 * @param {Collection} applicationCommands - The current application commands.
 * @returns {Function} The process command function.
 */
const processCommand = (applicationCommands) => async (localCommand) => {
   const { data } = localCommand;
   const commandName = data.name;
   const existingCommand = applicationCommands.cache.find(
      (cmd) => cmd.name === commandName
   );

   try {
      if (existingCommand) {
         await handleExistingCommand(
            applicationCommands,
            existingCommand,
            localCommand
         );
      } else if (!localCommand.deleted) {
         await createCommand(applicationCommands, data);
      } else {
         console.log(
            `[${new Date().toISOString()}] Skipped command (marked as deleted): ${commandName}`
               .grey
         );
      }
   } catch (err) {
      console.error(
         `[${new Date().toISOString()}] Failed to process command ${commandName}: ${err.message}`
            .red
      );
   }
};

/**
 * Handles the updating or deletion of an existing command.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Object} existingCommand - The existing command to handle.
 * @param {Object} localCommand - The local command data.
 */
async function handleExistingCommand(
   applicationCommands,
   existingCommand,
   localCommand
) {
   const { data, deleted } = localCommand;
   const commandName = data.name;

   if (deleted) {
      await applicationCommands.delete(existingCommand.id);
      console.log(
         `[${new Date().toISOString()}] Deleted command (marked as deleted): ${commandName}`
            .red
      );
   } else if (commandComparing(existingCommand, localCommand)) {
      await applicationCommands.edit(existingCommand.id, {
         name: commandName,
         description: data.description,
         options: data.options,
      });
      console.log(
         `[${new Date().toISOString()}] Updated command: ${commandName}`.yellow
      );
   }
}

/**
 * Creates a new command in the application.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Object} data - The command data.
 */
async function createCommand(applicationCommands, data) {
   await applicationCommands.create({
      name: data.name,
      description: data.description,
      options: data.options,
   });
   console.log(
      `[${new Date().toISOString()}] Registered new command: ${data.name}`.green
   );
}
