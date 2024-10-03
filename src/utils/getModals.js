import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

/**
 * Retrieves the directory path of the current file.
 * This is used to resolve relative paths within the project.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Dynamically imports and validates all modal files from the 'modals' directory, excluding specified exceptions.
 *
 * This function recursively searches for all modal files within the 'modals' directory,
 * imports and validates each file, and returns an array of valid modal objects excluding those
 * specified in the exceptions array.
 *
 * @param {Array<string>} exceptions - An array of modal names to exclude.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of valid modal objects.
 */
export default async (exceptions = []) => {
  const modalFiles = getAllFiles(path.join(__dirname, '..', 'modals'));

  /**
   * Imports and validates a single modal file.
   *
   * This function attempts to import a modal file, checks if the import is successful and
   * if the imported module has a valid 'name' property. If the file is valid
   * and its name is not in the exceptions array, it returns the module. Otherwise, it logs a warning
   * or error message and returns null.
   *
   * @param {string} modalFile - The path to the modal file.
   * @returns {Promise<any>} A promise that resolves to the validated modal module or null.
   */
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
