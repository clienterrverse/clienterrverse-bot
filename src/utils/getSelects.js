import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  let selects = [];
  const selectsFiles = getAllFiles(path.join(__dirname, '..', 'selects'));

  for (const selectsFile of selectsFiles) {
    try {
      // Convert the modal file path to a file URL
      const selectsFileURL = pathToFileURL(selectsFile).href;

      // Dynamically import the module using the file URL
      const { default: selectObject } = await import(selectsFileURL);

      if (exceptions.includes(selectObject.name)) continue;
      selects.push(selectObject);
    } catch (error) {
      console.error(`Error importing modal file ${selectsFile}: ${error}`);
    }
  }

  return selects;
};
