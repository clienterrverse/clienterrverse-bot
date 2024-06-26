import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const buttons = [];

  // Get all button files
  const buttonFiles = getAllFiles(path.join(__dirname, "..", "buttons"));

  // Import each button file
  for (const buttonFile of buttonFiles) {
    const buttonFileURL = pathToFileURL(buttonFile).href;

    try {
      const { default: buttonObject } = await import(buttonFileURL);

      // Check if the imported object is valid
      if (!buttonObject || typeof buttonObject !== 'object' || !buttonObject.name) {
        console.warn(`Skipped importing ${buttonFileURL} as it does not export a valid button object.`);
        continue;
      }

      // Skip exceptions
      if (exceptions.includes(buttonObject.name)) continue;

      // Add valid button object to the list
      buttons.push(buttonObject);
    } catch (error) {
      console.error(`Failed to import ${buttonFileURL}: ${error.message}`);
    }
  }

  return buttons;
};
