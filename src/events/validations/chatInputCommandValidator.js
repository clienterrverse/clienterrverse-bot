/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalCommands from '../../utils/getLocalCommands.js';

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

const cache = new LRUCache(100); // Adjust capacity as needed
const cooldowns = new Collection();
const commandMap = new Map();

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

const getCachedData = async (key, fetchFunction) => {
   const cachedItem = cache.get(key);
   if (cachedItem) return cachedItem;

   const data = await fetchFunction();
   cache.set(key, data);
   return data;
};

const getCachedLocalCommands = () =>
   getCachedData('localCommands', getLocalCommands);

const initializeCommandMap = async () => {
   const localCommands = await getCachedLocalCommands();
   localCommands.forEach((cmd) => {
      commandMap.set(cmd.data.name, cmd);
      if (cmd.aliases) {
         cmd.aliases.forEach((alias) => commandMap.set(alias, cmd));
      }
   });
};

const applyCooldown = (interaction, commandName, cooldownAmount) => {
   if (isNaN(cooldownAmount) || cooldownAmount <= 0) {
      throw new Error('Invalid cooldown amount');
   }

   const userCooldowns = cooldowns.get(commandName) || new Collection();
   const now = Date.now();
   const userId = `${interaction.user.id}-${interaction.guild ? interaction.guild.id : 'DM'}`;

   if (userCooldowns.has(userId)) {
      const expirationTime = userCooldowns.get(userId) + cooldownAmount;
      if (now < expirationTime) {
         return {
            active: true,
            timeLeft: ((expirationTime - now) / 1000).toFixed(1),
         };
      }
   }

   userCooldowns.set(userId, now);
   setTimeout(() => userCooldowns.delete(userId), cooldownAmount);
   cooldowns.set(commandName, userCooldowns);
   return { active: false };
};

const checkPermissions = (interaction, permissions, type) => {
   const member =
      type === 'user' ? interaction.member : interaction.guild.members.me;
   return permissions.every((permission) => member.permissions.has(permission));
};

export default async (client, errorHandler, interaction) => {
   if (!interaction.isChatInputCommand() && !interaction.isAutocomplete())
      return;

   if (commandMap.size === 0) {
      await initializeCommandMap(); // Initialize command map if it's empty
   }

   const { developersId, testServerId, maintenance } = config;

   try {
      const commandObject = commandMap.get(interaction.commandName);

      if (!commandObject) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            'Command not found.'
         );
      }

      if (interaction.isAutocomplete()) {
         return await commandObject.autocomplete(client, interaction);
      }

      if (maintenance && !developersId.includes(interaction.user.id)) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            'Bot is currently in maintenance mode. Please try again later.'
         );
      }

      const cooldown = applyCooldown(
         interaction,
         commandObject.data.name,
         (commandObject.cooldown || 3) * 1000
      );
      if (cooldown.active) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.commandCooldown.replace('{time}', cooldown.timeLeft)
         );
      }

      if (
         commandObject.devOnly &&
         !developersId.includes(interaction.user.id)
      ) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.commandDevOnly
         );
      }

      if (commandObject.testMode && interaction.guild.id !== testServerId) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.commandTestMode
         );
      }

      if (commandObject.nsfwMode && !interaction.channel.nsfw) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.nsfw
         );
      }

      if (
         commandObject.userPermissions?.length &&
         !checkPermissions(interaction, commandObject.userPermissions, 'user')
      ) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.userNoPermissions
         );
      }

      if (
         commandObject.botPermissions?.length &&
         !checkPermissions(interaction, commandObject.botPermissions, 'bot')
      ) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            mConfig.botNoPermissions
         );
      }

      try {
         await commandObject.run(client, interaction);
      } catch (err) {
         await errorHandler.handleError(err, {
            type: 'commandError',
            commandName: interaction.commandName,
            userId: interaction.user.id,
            guildId: interaction.guild?.id,
         });

         sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            'An error occurred while executing the command.'
         );
      }

      console.log(
         `Command executed: ${interaction.commandName} by ${interaction.user.tag}`
            .green
      );
   } catch (err) {
      await errorHandler.handleError(err, {
         type: 'commandError',
         commandName: interaction.commandName,
         userId: interaction.user.id,
         guildId: interaction.guild?.id,
      });

      sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'An error occurred while processing the command.'
      );
   }
};
