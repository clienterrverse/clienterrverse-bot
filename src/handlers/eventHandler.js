import path from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from '../utils/getAllFiles.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Registers an event and its handler in the event registry.
 * @param {Map} eventRegistry - The event registry.
 * @param {string} eventName - The name of the event.
 * @param {Object} eventInfo - Information about the event handler.
 */
const registerEvent = (eventRegistry, eventName, eventInfo) => {
   if (!eventRegistry.has(eventName)) {
      eventRegistry.set(eventName, []);
   }
   eventRegistry.get(eventName).push(eventInfo);
};

/**
 * Loads an event file and registers it in the event registry.
 * @param {string} eventFile - The path to the event file.
 * @param {string} eventName - The name of the event.
 * @param {Function} errorHandler - The error handler function.
 */
const loadEventFile = async (
   eventFile,
   eventName,
   errorHandler,
   eventRegistry
) => {
   try {
      const { default: eventFunction } = await import(
         encodeURI(`file://${eventFile}`)
      );
      if (typeof eventFunction !== 'function') {
         throw new Error(`Invalid or missing event function in ${eventFile}`);
      }
      const eventInfo = {
         function: eventFunction,
         fileName: path.basename(eventFile),
         priority: eventFunction.priority || 0,
      };
      registerEvent(eventRegistry, eventName, eventInfo);
   } catch (error) {
      errorHandler.handleError(error, {
         type: 'loadingEventFile',
         eventFile,
         eventName,
      });
   }
};

/**
 * Processes an event folder and loads all event files within it.
 * @param {string} eventFolder - The path to the event folder.
 * @param {Function} errorHandler - The error handler function.
 * @param {Map} eventRegistry - The event registry.
 */
const processEventFolder = async (eventFolder, errorHandler, eventRegistry) => {
   try {
      const eventFiles = getAllFiles(eventFolder);
      let eventName = path.basename(eventFolder);

      if (eventName === 'validations') {
         eventName = 'interactionCreate';
      }

      const loadPromises = eventFiles
         .filter((eventFile) => fs.lstatSync(eventFile).isFile())
         .map((eventFile) =>
            loadEventFile(eventFile, eventName, errorHandler, eventRegistry)
         );

      await Promise.all(loadPromises);
   } catch (error) {
      errorHandler.handleError(error, {
         type: 'processingEventFolder',
         eventFolder,
      });
   }
};

/**
 * Main function to load and register all event handlers.
 * @param {Object} client - The Discord client.
 * @param {Function} errorHandler - The error handler function.
 */
const loadEventHandlers = async (client, errorHandler) => {
   const eventRegistry = new Map();
   const loadedEvents = new Set();

   try {
      const eventFolders = getAllFiles(
         path.join(__dirname, '..', 'events'),
         true
      );

      await Promise.all(
         eventFolders.map((eventFolder) =>
            processEventFolder(eventFolder, errorHandler, eventRegistry)
         )
      );

      for (const [eventName, eventHandlers] of eventRegistry) {
         eventHandlers.sort((a, b) => b.priority - a.priority);

         if (!loadedEvents.has(eventName)) {
            client.on(eventName, async (...args) => {
               for (const handler of eventHandlers) {
                  try {
                     await handler.function(client, errorHandler, ...args);
                  } catch (error) {
                     errorHandler.handleError(error, {
                        type: 'executingEventHandler',
                        handler: handler.fileName,
                        eventName,
                     });
                  }
               }
            });
            loadedEvents.add(eventName);
         }
      }
   } catch (error) {
      errorHandler.handleError(error, { type: 'settingUpEventHandlers' });
   }
};

export default loadEventHandlers;
