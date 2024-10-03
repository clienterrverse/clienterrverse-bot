import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

/**
 * Get the directory name of the current module's file
 * @returns {string} The directory name of the current module's file
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Retrieves all select files, imports them, and validates them against a list of exceptions.
 *
 * @param {Array<string>} exceptions - An array of custom IDs to exclude from the selection.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of validated select objects.
 */
export default async (exceptions = []) => {
  const selectsFiles = getAllFiles(path.join(__dirname, '..', 'selects'));

  /**
   * Imports and validates a single select file.
   *
   * @param {string} selectsFile - The path to the select file.
   * @returns {Promise<any>} A promise that resolves to the select object if valid, otherwise null.
   */
  const importAndValidateSelect = async (selectsFile) => {
    try {
      // Convert the select file path to a file URL
      const selectsFileURL = pathToFileURL(selectsFile).href;

      // Dynamically import the module using the file URL
      const { default: selectObject } = await import(selectsFileURL);

      // Check if the select object's custom ID is in the exceptions list
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
  const selects = selectObjects.filter((selectObject) => selectObject !== null);

  return selects;
};
