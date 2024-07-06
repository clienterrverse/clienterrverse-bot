import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const buttons = [];

  // Get  button files
  const buttonFiles = getAllFiles(path.join(__dirname, '..', 'buttons'));

  // Import  button file
  for (const buttonFile of buttonFiles) {
    const buttonFileURL = pathToFileURL(buttonFile).href;

    try {
      const { default: buttonObject } = await import(buttonFileURL);

      // Check object is valid
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

      // Skip
      if (exceptions.includes(buttonObject.customId)) continue;

      buttons.push(buttonObject);
    } catch (error) {
      console.error(`Failed to import ${buttonFileURL}: ${error.message}`);
    }
  }

  return buttons;
};
