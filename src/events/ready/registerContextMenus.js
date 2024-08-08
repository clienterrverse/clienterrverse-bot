import 'colors';
import { config } from '../../config/config.js';
import getApplicationContextMenus from '../../utils/getApplicationCommands.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

/**
 * Registers, updates, or deletes application context menus based on local context menu files.
 * @param {Client} client - The Discord client instance.
 * @param {DiscordBotErrorHandler} errorHandler - Error handler instance.
 */
export default async (client, errorHandler) => {
   try {
      // Fetch local and application context menus
      const localContextMenus = await getLocalContextMenus();
      const applicationContextMenus = await getApplicationContextMenus(client);

      // Create a set of local context menu names for quick lookup
      const localContextMenuNames = new Set(
         localContextMenus.map((menu) => menu.data.name)
      );

      // Process each local context menu
      const tasks = localContextMenus.map(async (localContextMenu) => {
         const { data } = localContextMenu;
         const contextMenuName = data.name;
         const contextMenuType = data.type;

         const existingContextMenu = applicationContextMenus.cache.find(
            (menu) => menu.name === contextMenuName
         );

         try {
            if (existingContextMenu) {
               if (localContextMenu.deleted) {
                  // Delete the context menu if marked as deleted locally
                  await applicationContextMenus.delete(existingContextMenu.id);
                  console.log(`Deleted context menu: ${contextMenuName}`.red);
               }
            } else if (!localContextMenu.deleted) {
               // Create a new context menu if not deleted locally and not existing in application
               await applicationContextMenus.create({
                  name: contextMenuName,
                  type: contextMenuType,
               });
               console.log(
                  `Registered new context menu: ${contextMenuName}`.green
               );
            } else {
               // Log if context menu is skipped (marked as deleted locally)
               console.log(
                  `Skipped context menu (marked as deleted): ${contextMenuName}`
                     .grey
               );
            }
         } catch (err) {
            errorHandler.handleError(err, {
               type: 'contextMenuSync',
               contextMenuName,
               action: existingContextMenu ? 'update' : 'create',
            });
            console.error(
               `Failed to process context menu ${contextMenuName}: ${err.message}`
                  .red
            );
         }
      });

      // Execute all tasks concurrently
      await Promise.all(tasks);

      console.log('Context menu synchronization complete.'.green);
   } catch (err) {
      errorHandler.handleError(err, { type: 'contextMenuSync' });
      console.error(
         `Error while registering context menus: ${err.message}`.red
      );
   }
};
