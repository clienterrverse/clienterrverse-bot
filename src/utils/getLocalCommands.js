import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

/**
 * Retrieves the directory path of the current file.
 * This is used to resolve relative paths within the project.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically imports a single command file and returns the command object if it is valid.
 * This function checks if the command file is valid by ensuring it exports a default object with a 'name' property.
 * It also checks if the command name is in the list of exceptions provided.
 *
 * @param {string} commandFile - The path to the command file.
 * @param {string[]} exceptions - An array of command names to exclude from the import process.
 * @returns {(Object|null)} The command object if valid, otherwise null.
 * @throws {Error} Throws an error if there's a problem importing or processing the file, or if the command is in the exception list.
 */
async function importCommandFile(commandFile, exceptions) {
  const commandFileURL = pathToFileURL(commandFile).href;
  const commandModule = await import(commandFileURL);
  const commandObject = commandModule.default;

  // Validate the command file by checking if it exports a default object with a 'name' property.
  if (!commandObject?.data?.name) {
    throw new Error(`Command file ${commandFile} is invalid.`);
  }

  // Check if the command name is in the list of exceptions provided.
  if (exceptions.includes(commandObject.data.name)) {
    throw new Error(
      `Command ${commandObject.data.name} is in the exception list.`
    );
  }

  return commandObject;
}

/**
 * Loads all valid command files from the 'commands' directory, excluding any files specified in the exceptions list.
 * This function recursively retrieves all files in the 'commands' directory, filters out non-JavaScript files, and then imports each command file.
 *
 * @param {string[]} exceptions - An array of command names to exclude from the loading process.
 * @returns {Promise<Object[]>} A promise that resolves to an array of valid command objects.
 */
export default async function loadCommands(exceptions = []) {
  const commandsDir = path.resolve(__dirname, '..', 'commands');
  const allCommandFiles = getAllFiles(commandsDir).filter(
    (file) => file.endsWith('.js') // Filter out files that do not end with '.js'
  );

  const commands = [];
  for (const file of allCommandFiles) {
    try {
      const command = await importCommandFile(file, exceptions);
      commands.push(command);
    } catch (error) {
      console.error(`Error processing command file ${file}: ${error.message}`);
    }
  }

  return commands;
}
