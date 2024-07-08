import path from 'path';
import { fileURLToPath } from 'url';
import getAllFiles from '../utils/getAllFiles.js';
import 'colors';
import fs from 'fs';

// Define __filename and __dirname for ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (client, errorHandler) => {
   try {
      const eventFolders = getAllFiles(
         path.join(__dirname, '..', 'events'),
         true
      );

      const eventRegistry = new Map();

      for (const eventFolder of eventFolders) {
         const eventFiles = getAllFiles(eventFolder);
         let eventName = eventFolder.replace(/\\/g, '/').split('/').pop();

         // Rename 'validations' folder to 'interactionCreate' event
         if (eventName === 'validations') {
            eventName = 'interactionCreate';
         }

         // Initialize event handler array if not already present
         if (!eventRegistry.has(eventName)) {
            eventRegistry.set(eventName, []);
         }

         for (const eventFile of eventFiles) {
            if (fs.lstatSync(eventFile).isFile()) {
               try {
                  const { default: eventFunction } = await import(
                     `file://${eventFile}`
                  );
                  const eventInfo = {
                     function: eventFunction,
                     fileName: path.basename(eventFile),
                     priority: eventFunction.priority || 0,
                  };
                  eventRegistry.get(eventName).push(eventInfo);
               } catch (error) {
                  errorHandler.handleError(error, {
                     type: 'loadingEventFile',
                     eventFile,
                     eventName,
                  });
                  console.error(
                     `Error loading event file ${eventFile} for event ${eventName}:`,
                     error.message.red
                  );
               }
            }
         }
      }

      // Register sorted event handlers
      for (const [eventName, eventHandlers] of eventRegistry) {
         eventHandlers.sort((a, b) => b.priority - a.priority);

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
                     `Error executing event handler ${handler.fileName} for event ${eventName}:`,
                     error.message.red
                  );
               }
            }
         });
      }

      console.log('All event handlers registered successfully.'.green);
   } catch (error) {
      errorHandler.handleError(error, { type: 'settingUpEventHandlers' });
      console.error('Error setting up event handlers:', error.message.red);
   }
};
