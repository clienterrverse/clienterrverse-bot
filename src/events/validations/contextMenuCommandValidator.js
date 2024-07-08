/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

const contextMenus = new Collection();

const sendEmbedReply = async (
   interaction,
   color,
   description,
   ephemeral = true
) => {
   const embed = new EmbedBuilder().setColor(color).setDescription(description);
   await interaction.reply({ embeds: [embed], ephemeral });
};

const checkPermissions = (interaction, permissions, type) => {
   const member =
      type === 'user' ? interaction.member : interaction.guild.members.me;
   return permissions.every((permission) => member.permissions.has(permission));
};

const loadContextMenus = async () => {
   const menuFiles = await getLocalContextMenus();
   for (const menu of menuFiles) {
      contextMenus.set(menu.data.name, menu);
   }
   console.log(`Loaded ${contextMenus.size} context menu commands`.green);
};

const handleContextMenu = async (client, errorHandler, interaction) => {
   const { commandName } = interaction;
   const menuObject = contextMenus.get(commandName);

   if (!menuObject) return;

   const { developersId, testServerId } = config;

   if (menuObject.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandDevOnly
      );
   }

   if (menuObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandTestMode
      );
   }

   if (
      menuObject.userPermissions?.length &&
      !checkPermissions(interaction, menuObject.userPermissions, 'user')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.userNoPermissions
      );
   }

   if (
      menuObject.botPermissions?.length &&
      !checkPermissions(interaction, menuObject.botPermissions, 'bot')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.botNoPermissions
      );
   }

   try {
      await menuObject.run(client, interaction);
      console.log(
         `Context menu command executed: ${commandName} by ${interaction.user.tag}`
            .green
      );
   } catch (error) {
      console.error(
         `Error executing context menu command ${commandName}:`.red,
         error
      );

      // Use errorHandler to handle the error
      await errorHandler.handleError(error, {
         type: 'contextMenuError',
         commandName: commandName,
         userId: interaction.user.id,
         guildId: interaction.guild?.id,
      });

      sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'There was an error while executing this context menu command!'
      );
   }
};

export default async (client, errorHandler, interaction) => {
   if (!interaction.isContextMenuCommand()) return;
   await loadContextMenus();

   await handleContextMenu(client, errorHandler, interaction);
};
