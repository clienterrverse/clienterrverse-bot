import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import getAllFiles from './getAllFiles.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default async (exceptions = []) => {
  const localContextMenus = [];
  const contextmenuCategories = getAllFiles(path.join(__dirname, '..', 'contextmenus'), true);


  for (const contextmenuCategory of contextmenuCategories) {
    const contextmenuFiles = getAllFiles(contextmenuCategory);

    for (const contextmenuFile of contextmenuFiles) {
      try {
        const contextmenuFileURL = pathToFileURL(contextmenuFile).href;
        const { default: contextmenuModule } = await import(contextmenuFileURL);

        if (contextmenuModule && contextmenuModule.data && contextmenuModule.data.name && !exceptions.includes(contextmenuModule.data.name)) {
          localContextMenus.push(contextmenuModule);
        } else {
          console.warn(`Context menu file ${contextmenuFile} does not have a valid export or name property.`);
        }
      } catch (error) {
        console.error(`Error importing context menu file ${contextmenuFile}: ${error}`);
      }
    }
  }

  return localContextMenus;
};
