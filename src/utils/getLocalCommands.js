import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Imports a single command file and returns the command object if valid.
 * @param {string} commandFile - Path to the command file.
 * @param {string[]} exceptions - List of command names to exclude.
 * @returns {Object|null} The command object or null if invalid.
 */
async function importCommandFile(commandFile, exceptions) {
   try {
      const commandFileURL = pathToFileURL(commandFile).href;
      const commandModule = await import(commandFileURL);

      if (!commandModule?.default?.data?.name) {
         console.warn(`Command file ${commandFile} is invalid.`);
         return null;
      }

      const commandObject = commandModule.default;

      if (exceptions.includes(commandObject.data.name)) {
         console.warn(
            `Command ${commandObject.data.name} is in the exception list.`
         );
         return null;
      }

      return commandObject;
   } catch (error) {
      console.error(
         `Error importing command file ${commandFile}: ${error.message}`
      );
      return null;
   }
}

/**
 * Loads all valid command files from the commands directory.
 * @param {string[]} exceptions - List of command names to exclude.
 * @returns {Promise<Object[]>} Array of valid command objects.
 */
export default async function loadCommands(exceptions = []) {
   const commandsDir = path.join(__dirname, '..', 'commands');
   const allCommandFiles = getAllFiles(commandsDir).filter((file) =>
      file.endsWith('.js')
   );

   const commandPromises = allCommandFiles.map((file) =>
      importCommandFile(file, exceptions)
   );
   const commands = await Promise.all(commandPromises);

   return commands.filter(Boolean);
}
