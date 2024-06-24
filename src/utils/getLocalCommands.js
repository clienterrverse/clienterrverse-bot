import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const localCommands = [];
  const commandCategories = getAllFiles(path.join(__dirname, '..', 'commands'), true);

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) {
      try {
        // Convert the command file path to a file URL
        const commandFileURL = pathToFileURL(commandFile).href;

        // Dynamically import the module using the file URL
        const commandModule = await import(commandFileURL);

        // Validate command module
        if (!commandModule || !commandModule.default) {
          console.warn(`Command file ${commandFile} does not have a default export.`);
          continue;
        }

        const commandObject = commandModule.default;

        // Check if the commandObject has a valid data structure and name property
        if (commandObject.data && commandObject.data.name && !exceptions.includes(commandObject.data.name)) {
          localCommands.push(commandObject);
        } else {
          console.warn(`Command file ${commandFile} does not have a valid name property or is in the exceptions list.`);
        }
      } catch (error) {
        console.error(`Error importing command file ${commandFile}: ${error.message}`);
      }
    }
  }

  return localCommands;
};
