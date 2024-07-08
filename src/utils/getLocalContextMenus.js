import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
   const localContextMenus = [];
   const contextmenuCategories = getAllFiles(
      path.join(__dirname, '..', 'contextmenus'),
      true
   );

   // Function to import and validate a single context menu file
   const importAndValidateContextMenu = async (contextmenuFile) => {
      try {
         const contextmenuFileURL = pathToFileURL(contextmenuFile).href;
         const { default: contextmenuModule } = await import(
            contextmenuFileURL
         );

         if (
            contextmenuModule &&
            contextmenuModule.data &&
            contextmenuModule.data.name &&
            !exceptions.includes(contextmenuModule.data.name)
         ) {
            return contextmenuModule;
         } else {
            console.warn(
               `Context menu file ${contextmenuFile} does not have a valid export or name property.`
            );
            return null;
         }
      } catch (error) {
         console.error(
            `Error importing context menu file ${contextmenuFile}: ${error}`
         );
         return null;
      }
   };

   // Process all context menu categories in parallel
   const allContextMenuPromises = contextmenuCategories.map(
      async (contextmenuCategory) => {
         const contextmenuFiles = getAllFiles(contextmenuCategory);

         // Import all files in the category in parallel
         return Promise.all(contextmenuFiles.map(importAndValidateContextMenu));
      }
   );

   // Wait for all context menu imports to complete
   const allContextMenus = (await Promise.all(allContextMenuPromises)).flat();

   // Filter out null values
   allContextMenus.forEach((contextmenu) => {
      if (contextmenu) {
         localContextMenus.push(contextmenu);
      }
   });

   return localContextMenus;
};
