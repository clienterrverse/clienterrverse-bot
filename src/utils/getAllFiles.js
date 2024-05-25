import fs from 'fs';
import path from 'path';

export default (directory, foldersOnly = false) => {
  let fileNames = [];

  const files = fs.readdirSync(directory, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(directory, file.name);

    if (foldersOnly) {
      if (file.isDirectory()) {
        fileNames.push(filePath);
      };
    } else {
      if (file.isFile()) {
        fileNames.push(filePath);
      };
    };
  };

  return fileNames;
};