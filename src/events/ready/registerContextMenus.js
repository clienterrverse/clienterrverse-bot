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

    for (const localContextMenu of localContextMenus) {
      const { data } = localContextMenu;
      const contextMenuName = data.name;
      const contextMenuType = data.type;

      const existingContextMenu = applicationContextMenus.cache.find(cmd => cmd.name === contextMenuName);

      try {
        if (existingContextMenu) {
          if (localContextMenu.deleted) {
            await applicationContextMenus.delete(existingContextMenu.id);
            console.log(`Application context menu ${contextMenuName} has been deleted.`.red);
          }
        } else {
          if (localContextMenu.deleted) {
            console.log(`Application context menu ${contextMenuName} has been skipped, since property "deleted" is set to "true".`.grey);
          } else {
            await applicationContextMenus.create({
              name: contextMenuName,
              type: contextMenuType,
            });
            console.log(`Application context menu ${contextMenuName} has been registered.`.green);
          }
        }
      } catch (err) {
        console.error(`Failed to process application context menu ${contextMenuName}: ${err.message}`.red);
      }
    }
  } catch (err) {
    console.error(`An error occurred while registering context menus: ${err.message}`.red);
  }
};
