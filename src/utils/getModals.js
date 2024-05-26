import path from 'path';
import getAllFiles from './getAllFiles.js';

export default (exceptions = []) => {
  let modals = [];
  const modalFiles = getAllFiles(path.join(__dirname, "..", "modals"));

  for (const modalFile of modalFiles) {
    const modalObject = require(modalFile);

    if (exceptions.includes(modalObject.name)) continue;
    modals.push(modalObject);
  }

  return modals;
};
