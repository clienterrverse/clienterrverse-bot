import path from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  let localCommands = [];
  const commandCategories = getAllFiles(path.join(__dirname, '..', 'commands'), true);

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory);

    for (const commandFile of commandFiles) {
      try {
        // Dynamically import the module and get the default export
        const commandObject = await import(commandFile);
        
        // Check if the commandObject has a name property
        if (!exceptions.includes(commandObject.default.name)) {
          localCommands.push(commandObject.default);
        }
  
      } catch (error) {
        console.error(`Error importing command file ${commandFile}: ${error}`);
      }
    }
  }

  return localCommands;
};
