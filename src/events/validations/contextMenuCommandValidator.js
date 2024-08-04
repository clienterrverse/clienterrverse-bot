/** @format */

import 'colors';
import { EmbedBuilder } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalContextMenus from '../../utils/getLocalContextMenus.js';

class LRUCache {
   constructor(capacity) {
      this.capacity = capacity;
      this.cache = new Map();
   }

   get(key) {
      if (!this.cache.has(key)) return undefined;
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
   }

   set(key, value) {
      if (this.cache.has(key)) this.cache.delete(key);
      else if (this.cache.size >= this.capacity) {
         const firstKey = this.cache.keys().next().value;
         this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
   }
}

const contextMenus = new LRUCache(100); // Adjust capacity as needed

const sendEmbedReply = async (
   interaction,
   color,
   description,
   ephemeral = true
) => {
   try {
      const embed = new EmbedBuilder()
         .setColor(color)
         .setDescription(description)
         .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
         })
         .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral });
   } catch (err) {}
};

const checkPermissions = (interaction, permissions, type) => {
   const member =
      type === 'user' ? interaction.member : interaction.guild.members.me;
   return permissions.every((permission) => member.permissions.has(permission));
};

const loadContextMenus = async () => {
   try {
      const menuFiles = await getLocalContextMenus();
      for (const menu of menuFiles) {
         contextMenus.set(menu.data.name, menu);
      }
      console.log(
         `Loaded ${contextMenus.cache.size} context menu commands`.green
      );
   } catch (error) {
      console.error('Error loading context menus:'.red, error);
   }
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

// Call this function during bot initialization
await loadContextMenus();

export default async (client, errorHandler, interaction) => {
   if (!interaction.isContextMenuCommand()) return;

   await handleContextMenu(client, errorHandler, interaction);
};
