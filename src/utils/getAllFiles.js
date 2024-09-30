import fs from 'fs';
import path from 'path';

/**
 * Retrieves a list of files and/or directories within a specified directory.
 * This function recursively traverses the directory tree to gather all files and directories.
 *
 * @param {string} directory - The directory to read. This is the starting point for the file search.
 * @param {boolean} [foldersOnly=false] - Optional parameter to filter the results. If set to true, only directories will be included in the result.
 * @returns {string[]} - An array of strings representing the paths of files or directories found within the specified directory.
 */
const getAllFiles = (directory, foldersOnly = false) => {
  const stack = [directory]; // Initialize a stack with the starting directory
  const result = []; // Initialize an empty array to store the results

  while (stack.length > 0) {
    // Continue until all directories have been processed
    const currentPath = stack.pop(); // Pop the next directory from the stack
    const items = fs.readdirSync(currentPath, { withFileTypes: true }); // Read the contents of the current directory

    for (const item of items) {
      // Iterate through each item in the directory
      const fullPath = path.join(currentPath, item.name); // Construct the full path of the item

      if (item.isDirectory()) {
        // If the item is a directory
        if (foldersOnly) {
          // If foldersOnly is true, add the directory to the result
          result.push(fullPath);
        }
        stack.push(fullPath); // Add the directory to the stack to be processed
      } else if (!foldersOnly && item.isFile()) {
        // If the item is a file and foldersOnly is false, add the file to the result
        result.push(fullPath);
      }
    }
  }

  return result; // Return the array of file and directory paths
};

export default getAllFiles;
