import path from 'path';
import getAllFiles from './getAllFiles.js';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));


export default async(exepctions = []) => {
  let buttons = [];
  const buttonFiles = getAllFiles(path.join(__dirname, "..", "buttons"));

  for (const buttonFile of buttonFiles) {
    const buttonObject = await import(buttonFile);

    if (exepctions.includes(buttonObject.name)) continue;
    buttons.push(buttonObject);
  };

  return buttons;
};