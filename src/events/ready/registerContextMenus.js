import 'colors';
import config from '../../config/config.json' assert { type: 'json' };
import getApplicationContextMenus from '../../utils/getApplicationCommands.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

export default async (client) => {
  try {
    const { testServerId } = config;

    const localContextMenus = await getLocalContextMenus();
    const applicationContextMenus = await getApplicationContextMenus(client, testServerId);
    const localContextMenuNames = new Set(localContextMenus.map(cmd => cmd.data.name));

    // Delete application context menus not present in local context menus
    await Promise.all(applicationContextMenus.cache.map(async (applicationContextMenu) => {
      try {
        if (!localContextMenuNames.has(applicationContextMenu.name)) {
          await applicationContextMenus.delete(applicationContextMenu.id);
          console.log(`🗑 Application command ${applicationContextMenu.name} has been deleted because it was not found in local context menus.`.red);
        }
      } catch (err) {
        console.error(`Failed to delete application command ${applicationContextMenu.name}: ${err.message}`.red);
      }
    }));

    // Register or update local context menus
    await Promise.all(localContextMenus.map(async (localContextMenu) => {
      const { data: { name: contextMenuName, type: contextMenuType } } = localContextMenu;
      const existingContextMenu = applicationContextMenus.cache.find(cmd => cmd.name === contextMenuName);

      try {
        if (existingContextMenu) {
          if (localContextMenu.deleted) {
            await applicationContextMenus.delete(existingContextMenu.id);
            console.log(`🗑 Application command ${contextMenuName} has been deleted.`.red);
          }
        } else if (!localContextMenu.deleted) {
          await applicationContextMenus.create({ name: contextMenuName, type: contextMenuType });
          console.log(`Application command ${contextMenuName} has been registered.`.green);
        } else {
          console.log(`Application command ${contextMenuName} has been skipped, since property "deleted" is set to "true".`.grey);
        }
      } catch (err) {
        console.error(`Failed to process application command ${contextMenuName}: ${err.message}`.red);
      }
    }));
  } catch (err) {
    console.error(`An error occurred while registering context menus: ${err.message}`.red);
  }
};
