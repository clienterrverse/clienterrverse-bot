import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  let modals = [];
  const modalFiles = getAllFiles(path.join(__dirname, '..', 'modals'));

  for (const modalFile of modalFiles) {
    try {
      // Convert the modal file path to a file URL
      const modalFileURL = pathToFileURL(modalFile).href;

      // Dynamically import the module using the file URL
      const { default: modalObject } = await import(modalFileURL);

      if (exceptions.includes(modalObject.name)) continue;
      modals.push(modalObject);
    } catch (error) {
      console.error(`Error importing modal file ${modalFile}: ${error}`);
    }
  }

  return modals;
};
