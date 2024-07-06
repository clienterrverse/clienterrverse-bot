import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const modalFiles = getAllFiles(path.join(__dirname, '..', 'modals'));

  // Function to import and validate a single modal file
  const importAndValidateModal = async (modalFile) => {
    try {
      // Convert the modal file path to a file URL
      const modalFileURL = pathToFileURL(modalFile).href;

      // Dynamically import the module using the file URL
      const { default: modalObject } = await import(modalFileURL);

      // Check if the modal name is in the exceptions list
      if (exceptions.includes(modalObject.name)) return null;

      return modalObject;
    } catch (error) {
      console.error(
        `Error importing modal file ${modalFile}: ${error.message}`
      );
      return null;
    }
  };

  // Import all modal files in parallel
  const modalPromises = modalFiles.map(importAndValidateModal);
  const modalObjects = await Promise.all(modalPromises);

  // Filter out any null values (failed imports or exceptions)
  const modals = modalObjects.filter((modalObject) => modalObject !== null);

  return modals;
};
