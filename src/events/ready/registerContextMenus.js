import 'colors';
import config from '../../config/config.json'assert { type: 'json' };
import getApplicationContextMenus from '../../utils/getApplicationCommands.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

export default async (client) => {
  try {
    const { testServerId } = config;

    const localContextMenus = await getLocalContextMenus();
    const applicationContextMenus = await getApplicationContextMenus(client, testServerId);


    for (const localContextMenuModule of localContextMenus) {
      const localContextMenu = localContextMenuModule.default; // Access the default property
      const { data } = localContextMenu; // Destructure data from localContextMenu

      const contextMenuName = data.name;
      const contextMenuType = data.type;

      const existingContextMenu = applicationContextMenus.cache.find(
        (cmd) => cmd.name === contextMenuName
      );

      if (existingContextMenu) {
        if (localContextMenu.deleted) {
          await applicationContextMenus.delete(existingContextMenu.id);
          console.log(
            `Application command ${contextMenuName} has been deleted.`.red
          );
          continue;
        }
      } else {
        if (localContextMenu.deleted) {
          console.log(
            `Application command ${contextMenuName} has been skipped, since property "deleted" is set to "true".`
              .grey
          );
          continue;
        }

        await applicationContextMenus.create({
          name: contextMenuName,
          type: contextMenuType,
        });
        console.log(
          `Application command ${contextMenuName} has been registered.`.green
        );
      }
    }
  } catch (err) {
    console.log(
      `An error occurred while registering context menu's! ${err}`.red
    );
  }
};
