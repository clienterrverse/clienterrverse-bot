import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';


const __dirname = path.dirname(fileURLToPath(import.meta.url));


export default async(exepctions = []) => {
  let buttons = [];
  const buttonFiles = getAllFiles(path.join(__dirname, "..", "buttons"));

  for (const buttonFile of buttonFiles) {
    const buttonFileURL = pathToFileURL(buttonFile).href;



    const {default: buttonObject} = await import(buttonFileURL);

    if (exepctions.includes(buttonObject.name)) continue;
    buttons.push(buttonObject);
  };

  return buttons;
};