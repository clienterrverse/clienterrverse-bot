import path from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  let localContextMenus = [];
  
  // Use path.join to construct the directory path
  const menuFiles = getAllFiles(path.join(__dirname, '..', 'contextmenus'));

  for (const menuFile of menuFiles) {
    // Assuming `menuFile` contains the exported object directly
    const menuObject = await import(menuFile);

    if (exceptions.includes(menuObject.name)) continue;
    localContextMenus.push(menuObject);
  }

  return localContextMenus;
};
