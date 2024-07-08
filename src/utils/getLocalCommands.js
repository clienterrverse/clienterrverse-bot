import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
   const localCommands = [];
   const commandCategories = getAllFiles(
      path.join(__dirname, '..', 'commands'),
      true
   );

   const importCommandFiles = async (commandCategory) => {
      const commandFiles = getAllFiles(commandCategory);

      return Promise.all(
         commandFiles.map(async (commandFile) => {
            try {
               const commandFileURL = pathToFileURL(commandFile).href;
               const commandModule = await import(commandFileURL);

               if (!commandModule || !commandModule.default) {
                  console.warn(
                     `Command file ${commandFile} does not have a default export.`
                  );
                  return null;
               }

               const commandObject = commandModule.default;

               if (
                  commandObject.data &&
                  commandObject.data.name &&
                  !exceptions.includes(commandObject.data.name)
               ) {
                  return commandObject;
               } else {
                  console.warn(
                     `Command file ${commandFile} does not have a valid name property or is in the exc list`
                  );
                  return null;
               }
            } catch (error) {
               console.error(
                  `Error importing command file ${commandFile}: ${error.message}`
               );
               return null;
            }
         })
      );
   };

   const allCommands = await Promise.all(
      commandCategories.map(importCommandFiles)
   );

   allCommands.flat().forEach((command) => {
      if (command) {
         localCommands.push(command);
      }
   });

   return localCommands;
};
