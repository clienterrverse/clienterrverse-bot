import path from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from '../utils/getAllFiles.js';
import 'colors';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (client, errorHandler) => {
   const eventRegistry = new Map();
   const loadedEvents = new Set();

   const registerEvent = (eventName, eventInfo) => {
      if (!eventRegistry.has(eventName)) {
         eventRegistry.set(eventName, []);
      }
      eventRegistry.get(eventName).push(eventInfo);
   };

   const loadEventFile = async (eventFile, eventName) => {
      try {
         const { default: eventFunction } = await import(`file://${eventFile}`);
         const eventInfo = {
            function: eventFunction,
            fileName: path.basename(eventFile),
            priority: eventFunction.priority || 0,
         };
         registerEvent(eventName, eventInfo);
      } catch (error) {
         errorHandler.handleError(error, {
            type: 'loadingEventFile',
            eventFile,
            eventName,
         });
      }
   };

   const processEventFolder = async (eventFolder) => {
      const eventFiles = getAllFiles(eventFolder);
      let eventName = eventFolder.replace(/\\/g, '/').split('/').pop();

      if (eventName === 'validations') {
         eventName = 'interactionCreate';
      }

      for (const eventFile of eventFiles) {
         if (fs.lstatSync(eventFile).isFile()) {
            await loadEventFile(eventFile, eventName);
         }
      }
   };

   try {
      const eventFolders = getAllFiles(
         path.join(__dirname, '..', 'events'),
         true
      );

      for (const eventFolder of eventFolders) {
         await processEventFolder(eventFolder);
      }

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
                     console.error(
                        `Error executing event handler ${handler.fileName} for event ${eventName}:`
                           .red,
                        error
                     );
                  }
               }
            });
            loadedEvents.add(eventName);
         }
      }
   } catch (error) {
      errorHandler.handleError(error, { type: 'settingUpEventHandlers' });
      console.error('Error setting up event handlers:'.red, error);
   }
};
