import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
   const selectsFiles = getAllFiles(path.join(__dirname, '..', 'selects'));

   // Function to import and validate a single select file
   const importAndValidateSelect = async (selectsFile) => {
      try {
         // Convert the select file path to a file URL
         const selectsFileURL = pathToFileURL(selectsFile).href;

         // Dynamically import the module using the file URL
         const { default: selectObject } = await import(selectsFileURL);

         if (exceptions.includes(selectObject.customId)) return null;

         return selectObject;
      } catch (error) {
         console.error(
            `Error importing select file ${selectsFile}: ${error.message}`
         );
         return null;
      }
   };

   // Import all select files in parallel
   const selectPromises = selectsFiles.map(importAndValidateSelect);
   const selectObjects = await Promise.all(selectPromises);

   // Filter out any null values (failed imports or exceptions)
   const selects = selectObjects.filter(
      (selectObject) => selectObject !== null
   );

   return selects;
};
