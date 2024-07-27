import fs from 'fs';
import path from 'path';

/**
 * Get a list of files and/or directories within a specified directory.
 *
 * @param {string} directory - The directory to read.
 * @param {boolean} [foldersOnly=false] - If true, only directories will be included in the result.
 * @returns {string[]} - List of file or directory paths.
 */
const getAllFiles = (directory, foldersOnly = false) => {
   const stack = [directory];
   const result = [];

   while (stack.length > 0) {
      const currentPath = stack.pop();
      const items = fs.readdirSync(currentPath, { withFileTypes: true });

      for (const item of items) {
         const fullPath = path.join(currentPath, item.name);

         if (item.isDirectory()) {
            if (foldersOnly) {
               result.push(fullPath);
            }
            stack.push(fullPath);
         } else if (!foldersOnly && item.isFile()) {
            result.push(fullPath);
         }
      }
   }

   return result;
};

export default getAllFiles;
