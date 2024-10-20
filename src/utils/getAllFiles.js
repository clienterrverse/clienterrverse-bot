import fs from 'fs';
import path from 'path';

/**
 * Recursively retrieves all files or folders from a specified directory.
 * This function walks through a directory tree, either collecting all files or folders
 * depending on the `foldersOnly` parameter. It logs errors if a directory cannot be read and skips that directory.
 *
 * @param {string} directory - The path of the starting directory.
 * @param {boolean} [foldersOnly=false] - If true, the function returns only folder paths. If false (default), it returns file paths.
 * @returns {string[]} - An array of full paths (strings) to either files or folders, depending on the `foldersOnly` parameter.
 *
 * @throws {Error} Throws an error if a directory cannot be read, though it continues processing other directories.
 *
 * @example
 * // Basic usage to get all file paths from a directory
 * const files = getAllFiles(path.join(__dirname, 'commands'));
 * console.log(files);
 *
 * @example
 * // To retrieve only folder paths
 * const folders = getAllFiles(path.join(__dirname, 'commands'), true);
 * console.log(folders);
 *
 * @note
 * If the function encounters a directory that cannot be accessed (e.g., due to permission issues),
 * it will log the error and skip that directory instead of terminating execution.
 *
 * @see {@link https://nodejs.org/api/fs.html#fsreaddirsyncpath-options} for more information on `fs.readdirSync`.
 * @since 0.0.1
 */
const getAllFiles = (directory, foldersOnly = false) => {
  const stack = [directory]; // Stack to track directories to explore
  const result = []; // Result array to hold file or folder paths

  // Process the stack until all directories are explored
  while (stack.length > 0) {
    const currentPath = stack.pop();

    if (!currentPath) continue;

    let items;
    try {
      items = fs.readdirSync(currentPath, {
        withFileTypes: true,
      });
    } catch (error) {
      console.error(`Error reading directory ${currentPath}:`, error);
      continue;
    }

    if (!items) continue; // Ensure items is defined and iterable

    for (const item of items) {
      const fullPath = path.join(currentPath, item.name);

      if (item.isDirectory()) {
        if (foldersOnly) {
          result.push(fullPath); // Add folder to result
        }
        stack.push(fullPath); // Add directory to stack for further exploration
      } else if (!foldersOnly && item.isFile()) {
        result.push(fullPath); // Add file to result if foldersOnly is false
      }
    }
  }

  return result;
};

export default getAllFiles;