import 'colors';
import { config } from '../../config/config.js';
import getApplicationContextMenus from '../../utils/getApplicationCommands.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

export default async (client) => {
  try {
    const { testServerId } = config;

    const localContextMenus = await getLocalContextMenus();
    const applicationContextMenus = await getApplicationContextMenus(client, testServerId);

    const localContextMenuNames = new Set(localContextMenus.map(cmd => cmd.data.name));

    const tasks = localContextMenus.map(async (localContextMenu) => {
      const { data } = localContextMenu;
      const contextMenuName = data.name;
      const contextMenuType = data.type;

      const existingContextMenu = applicationContextMenus.cache.find(cmd => cmd.name === contextMenuName);

      try {
        if (existingContextMenu) {
          if (localContextMenu.deleted) {
            await applicationContextMenus.delete(existingContextMenu.id);
            console.log(`Deleted context menu: ${contextMenuName}`.red);
          }
        } else if (!localContextMenu.deleted) {
          await applicationContextMenus.create({
            name: contextMenuName,
            type: contextMenuType,
          });
          console.log(`Registered new context menu: ${contextMenuName}`.green);
        } else {
          console.log(`Skipped context menu (marked as deleted): ${contextMenuName}`.grey);
        }
      } catch (err) {
        console.error(`Failed to process context menu ${contextMenuName}: ${err.message}`.red);
      }
    });

    await Promise.all(tasks);
  } catch (err) {
    console.error(`Error while registering context menus: ${err.message}`.red);
  }
};
