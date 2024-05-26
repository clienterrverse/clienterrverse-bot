import fs from 'fs';
import path from 'path';

export default (directory, foldersOnly = false) => {
  const items = [];

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name); // Using file.name to get the proper name

    if (foldersOnly) {
      if (file.isDirectory()) {
        items.push(filePath);
      }
    } else {
      if (file.isFile()) {
        items.push(filePath);
      }
    }
  }

  return items;
};
