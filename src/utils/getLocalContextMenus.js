import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

/**
 * Retrieves the directory path of the current file.
 * @returns {string} The directory path of the current file.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Retrieves all local context menus excluding specified exceptions.
 *
 * This function recursively searches for all context menu files within the 'contextmenus' directory,
 * imports and validates each file, and returns an array of valid context menus excluding those
 * specified in the exceptions array.
 *
 * @param {Array<string>} exceptions - An array of context menu names to exclude.
 * @returns {Promise<Array<any>>} A promise that resolves to an array of valid context menus.
 */
export default async (exceptions = []) => {
  const localContextMenus = [];
  const contextmenuCategories = getAllFiles(
    path.join(__dirname, '..', 'contextmenus'),
    true
  );

  /**
   * Imports and validates a single context menu file.
   *
   * This function attempts to import a context menu file, checks if the import is successful and
   * if the imported module has a valid 'data' property with a 'name' property. If the file is valid
   * and its name is not in the exceptions array, it returns the module. Otherwise, it logs a warning
   * or error message and returns null.
   *
   * @param {string} contextmenuFile - The path to the context menu file.
   * @returns {Promise<any>} A promise that resolves to the validated context menu module or null.
   */
  const importAndValidateContextMenu = async (contextmenuFile) => {
    try {
      const contextmenuFileURL = pathToFileURL(contextmenuFile).href;
      const { default: contextmenuModule } = await import(contextmenuFileURL);

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
