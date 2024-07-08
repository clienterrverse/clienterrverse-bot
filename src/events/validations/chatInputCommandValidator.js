/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getLocalCommands from '../../utils/getLocalCommands.js';

const cooldowns = new Collection();
const cache = new Map();
const metrics = {
   commandUsage: new Collection(),
   commandErrors: new Collection(),
};

const sendEmbedReply = async (
   interaction,
   color,
   description,
   ephemeral = true
) => {
   try {
      const embed = new EmbedBuilder()
         .setColor(color)
         .setDescription(description);
      await interaction.reply({ embeds: [embed], ephemeral });
   } catch (err) {
      console.error(`Failed to send embed reply: ${err.message}`.red);
   }
};

const getCachedData = async (key, fetchFunction) => {
   const now = Date.now();
   const cacheDuration = config.cacheDuration * 1000;
   const cachedItem = cache.get(key);

   if (cachedItem && now - cachedItem.timestamp < cacheDuration) {
      return cachedItem.data;
   }

   const data = await fetchFunction();
   cache.set(key, { data, timestamp: now });
   return data;
};

const getCachedLocalCommands = () =>
   getCachedData('localCommands', getLocalCommands);

const applyCooldown = (interaction, commandName, cooldownAmount) => {
   const userCooldowns = cooldowns.get(commandName) || new Collection();
   const now = Date.now();
   const userId = `${interaction.user.id}-${
      interaction.guild ? interaction.guild.id : 'DM'
   }`;

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

   const localCommands = await getCachedLocalCommands();
   const { developersId, testServerId, maintenance } = config;

   try {
      const commandObject = localCommands.find(
         (cmd) =>
            cmd.data.name === interaction.commandName ||
            cmd.aliases?.includes(interaction.commandName)
      );

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

      if (!interaction.guild && !commandObject.dmAllowed) {
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            'This command can only be used within a server.'
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

      // Run the command in a try-catch block to ensure errors are handled
      try {
         await commandObject.run(client, interaction);
      } catch (err) {
         // Use errorHandler to handle the error
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

         throw err;
      }

      console.log(
         `Command executed: ${interaction.commandName} by ${interaction.user.tag}`
            .green
      );
   } catch (err) {
      // Use errorHandler to handle the error
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
