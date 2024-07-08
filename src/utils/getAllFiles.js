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
   const items = [];

   const files = fs.readdirSync(directory, { withFileTypes: true });

   for (const file of files) {
      const filePath = path.join(directory, file.name);

      if (foldersOnly) {
         if (file.isDirectory()) {
            items.push(filePath);
            items.push(...getAllFiles(filePath, foldersOnly)); // Recursively get subfolders
         }
      } else {
         if (file.isDirectory()) {
            items.push(...getAllFiles(filePath, foldersOnly)); // Recursively get files and subfolders
         } else if (file.isFile()) {
            items.push(filePath);
         }
      }
   }

   return items;
};

export default getAllFiles;
