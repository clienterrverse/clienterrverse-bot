import 'colors';
import { ApplicationCommandType } from 'discord.js';
import { config } from '../../config/config.js';
import commandComparing from '../../utils/commandComparing.js';
import getApplicationCommands from '../../utils/getApplicationCommands.js';
import getLocalCommands from '../../utils/getLocalCommands.js';

/**
 * Registers, updates, or deletes application commands based on local command files.
 * @param {Client} client - The Discord client instance.
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 */
export default async (client, errorHandler) => {
   try {
      const { testServerId } = config;
      const [localCommands, applicationCommands] = await Promise.all([
         getLocalCommands(),
         getApplicationCommands(client),
      ]);

      await deleteUnusedCommands(
         applicationCommands,
         localCommands,
         errorHandler
      );
      await updateOrCreateCommands(
         applicationCommands,
         localCommands,
         errorHandler
      );
   } catch (err) {
      errorHandler.handleError(err, { type: 'commandSync' });
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
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 */
async function deleteUnusedCommands(
   applicationCommands,
   localCommands,
   errorHandler
) {
   const localCommandNames = new Set(localCommands.map((cmd) => cmd.data.name));
   const commandsToDelete = applicationCommands.cache.filter(
      (cmd) =>
         cmd.type === ApplicationCommandType.ChatInput &&
         !localCommandNames.has(cmd.name)
   );

   await Promise.all(
      commandsToDelete.map((cmd) =>
         deleteCommand(applicationCommands, errorHandler)(cmd)
      )
   );
}

/**
 * Updates existing commands or creates new ones based on local command files.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Array} localCommands - The local commands.
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 */
async function updateOrCreateCommands(
   applicationCommands,
   localCommands,
   errorHandler
) {
   await Promise.all(
      localCommands.map(processCommand(applicationCommands, errorHandler))
   );
}

/**
 * Deletes a command from the application.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 * @returns {Function} The delete command function.
 */
const deleteCommand = (applicationCommands, errorHandler) => async (cmd) => {
   try {
      await applicationCommands.delete(cmd.id);
      console.log(
         `[${new Date().toISOString()}] Deleted command: ${cmd.name}`.red
      );
   } catch (err) {
      errorHandler.handleError(err, {
         type: 'deleteCommand',
         commandName: cmd.name,
      });
      console.error(
         `[${new Date().toISOString()}] Failed to delete command ${cmd.name}: ${err.message}`
            .red
      );
   }
};

/**
 * Processes a local command, updating or creating it as needed.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 * @returns {Function} The process command function.
 */
const processCommand =
   (applicationCommands, errorHandler) => async (localCommand) => {
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
               localCommand,
               errorHandler
            );
         } else if (!localCommand.deleted) {
            await createCommand(applicationCommands, data, errorHandler);
         } else {
            console.log(
               `[${new Date().toISOString()}] Skipped command (marked as deleted): ${commandName}`
                  .grey
            );
         }
      } catch (err) {
         errorHandler.handleError(err, { type: 'processCommand', commandName });
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
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 */
async function handleExistingCommand(
   applicationCommands,
   existingCommand,
   localCommand,
   errorHandler
) {
   const { data, deleted } = localCommand;
   const commandName = data.name;

   try {
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
            contexts: data.contexts,
            integration_types: data.integration_types,
         });
         console.log(
            `[${new Date().toISOString()}] Updated command: ${commandName}`
               .yellow
         );
      }
   } catch (err) {
      errorHandler.handleError(err, {
         type: 'handleExistingCommand',
         commandName,
      });
      console.error(
         `[${new Date().toISOString()}] Failed to handle existing command ${commandName}: ${err.message}`
            .red
      );
   }
}

/**
 * Creates a new command in the application.
 * @param {Collection} applicationCommands - The current application commands.
 * @param {Object} data - The command data.
 * @param {DiscordBotErrorHandler} errorHandler - The error handler instance.
 */
async function createCommand(applicationCommands, data, errorHandler) {
   try {
      await applicationCommands.create({
         name: data.name,
         description: data.description,
         options: data.options,
         contexts: data.contexts,
         integration_types: data.integration_types,
      });
      console.log(
         `[${new Date().toISOString()}] Registered new command: ${data.name}`
            .green
      );
   } catch (err) {
      errorHandler.handleError(err, {
         type: 'createCommand',
         commandName: data.name,
      });
      console.error(
         `[${new Date().toISOString()}] Failed to create command ${data.name}: ${err.message}`
            .red
      );
   }
}
