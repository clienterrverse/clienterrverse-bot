import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Imports a single command file and returns the command object if valid.
 * @param {string} commandFile - Path to the command file.
 * @param {string[]} exceptions - List of command names to exclude.
 * @returns {Object|null} The command object or null if invalid.
 * @throws {Error} If there's an error importing or processing the file.
 */
async function importCommandFile(commandFile, exceptions) {
   const commandFileURL = pathToFileURL(commandFile).href;
   const commandModule = await import(commandFileURL);
   const commandObject = commandModule.default;

   if (!commandObject?.data?.name) {
      throw new Error(`Command file ${commandFile} is invalid.`);
   }

   if (exceptions.includes(commandObject.data.name)) {
      throw new Error(
         `Command ${commandObject.data.name} is in the exception list.`
      );
   }

   return commandObject;
}

/**
 * Loads all valid command files from the commands directory.
 * @param {string[]} exceptions - List of command names to exclude.
 * @returns {Promise<Object[]>} Array of valid command objects.
 */
export default async function loadCommands(exceptions = []) {
   const commandsDir = path.resolve(__dirname, '..', 'commands');
   const allCommandFiles = getAllFiles(commandsDir).filter((file) =>
      file.endsWith('.js')
   );

   const commands = [];
   for (const file of allCommandFiles) {
      try {
         const command = await importCommandFile(file, exceptions);
         commands.push(command);
      } catch (error) {
         console.error(
            `Error processing command file ${file}: ${error.message}`
         );
      }
   }

   return commands;
}
