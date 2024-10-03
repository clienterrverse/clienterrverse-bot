import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

/**
 * This function dynamically imports and returns an array of button objects from files in the 'buttons' directory.
 * It filters out any files that do not export a valid button object or are explicitly excluded.
 *
 * @param {Array<string>} exceptions - An array of customId strings to exclude from the returned buttons.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of button objects.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const buttons = [];

  // Retrieve all files in the 'buttons' directory
  const buttonFiles = getAllFiles(path.join(__dirname, '..', 'buttons'));

  // Iterate through each button file
  for (const buttonFile of buttonFiles) {
    const buttonFileURL = pathToFileURL(buttonFile).href;

    try {
      // Dynamically import the button file
      const { default: buttonObject } = await import(buttonFileURL);

      // Validate the imported object
      if (
        !buttonObject ||
        typeof buttonObject !== 'object' ||
        !buttonObject.customId
      ) {
        console.warn(
          `Skipped importing ${buttonFileURL} as it does not export a valid button object.`
        );
        continue;
      }

      // Skip the button if its customId is in the exceptions array
      if (exceptions.includes(buttonObject.customId)) continue;

      // Add the valid button object to the buttons array
      buttons.push(buttonObject);
    } catch (error) {
      console.error(`Failed to import ${buttonFileURL}: ${error.message}`);
    }
  }

  return buttons;
};
