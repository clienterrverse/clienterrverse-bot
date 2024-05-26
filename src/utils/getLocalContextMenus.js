import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

// Get the directory name of the current module's file
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  let localContextMenus = [];
  
  // Use path.join to construct the directory path
  const contextmenuCategories = getAllFiles(path.join(__dirname, '..', 'contextmenus'), true);

  for (const contextmenuCategory of contextmenuCategories) {
    const contextmenuFiles = getAllFiles(contextmenuCategory);

    for (const contextmenuFile of contextmenuFiles) {
      try {
        const contextmenuFileURL = pathToFileURL(contextmenuFile).href;
        const { default: contextmenuModule } = await import(contextmenuFileURL);

        // Check if the module has a default export
        if (contextmenuModule) {
          const contextmenuObject = contextmenuModule;

          // Check if the contextmenuObject has a name property
          if (contextmenuObject.data && contextmenuObject.data.name && !exceptions.includes(contextmenuObject.data.name)) {
            localContextMenus.push(contextmenuObject);
          } else {
            console.warn(`Context menu file ${contextmenuFile} does not have a valid name property.`);
          }
        } else {
          console.warn(`Context menu file ${contextmenuFile} does not have a default export.`);
        }
      } catch (error) {
        console.error(`Error importing context menu file ${contextmenuFile}:`, error);
      }
    }
  }

  return localContextMenus;
};
