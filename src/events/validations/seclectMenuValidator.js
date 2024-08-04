/** @format */

import 'colors';
import { EmbedBuilder, Collection, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getSelects from '../../utils/getSelects.js';

const selects = new Collection();
let selectsLoaded = false;

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
   return permissions.every((permission) =>
      member.permissions.has(PermissionsBitField.Flags[permission])
   );
};

const loadSelects = async (errorHandler) => {
   try {
      const selectFiles = await getSelects();
      for (const select of selectFiles) {
         if (select && select.customId) {
            selects.set(select.customId, select);
         }
      }
      console.log(`Loaded ${selects.size} select menu commands`.green);
      selectsLoaded = true;
   } catch (error) {
      errorHandler.handleError(error, { type: 'selectLoad' });
      console.error('Error loading select menus:'.red, error);
   }
};

const handleSelect = async (client, errorHandler, interaction) => {
   const { customId } = interaction;
   const selectObject = selects.get(customId);
   if (!selectObject) return;

   const { developersId, testServerId } = config;

   if (selectObject.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandDevOnly
      );
   }

   if (
      selectObject.testMode &&
      interaction.guild &&
      interaction.guild.id !== testServerId
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandTestMode
      );
   }

   if (
      selectObject.userPermissions?.length &&
      !checkPermissions(interaction, selectObject.userPermissions, 'user')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.userNoPermissions
      );
   }

   if (
      selectObject.botPermissions?.length &&
      !checkPermissions(interaction, selectObject.botPermissions, 'bot')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.botNoPermissions
      );
   }

   if (
      interaction.message.interaction &&
      interaction.message.interaction.user.id !== interaction.user.id
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.cannotUseSelect
      );
   }

   if (selectObject.cooldown) {
      const cooldownKey = `${interaction.user.id}-${customId}`;
      const cooldownTime = selects.get(cooldownKey);
      if (cooldownTime && Date.now() < cooldownTime) {
         const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            `Please wait ${remainingTime} seconds before using this select menu again.`
         );
      }
      selects.set(cooldownKey, Date.now() + selectObject.cooldown * 1000);
   }

   try {
      await selectObject.run(client, interaction);
      console.log(
         `Select menu ${interaction.customId} used by ${interaction.user.tag} in ${interaction.guild?.name}`
            .yellow
      );
   } catch (error) {
      console.error(`Error executing select menu ${customId}:`.red, error);

      await errorHandler.handleError(error, {
         type: 'selectError',
         selectId: customId,
         userId: interaction.user.id,
         guildId: interaction.guild?.id,
      });

      sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'There was an error while processing this select menu!'
      );
   }
};

export default async (client, errorHandler, interaction) => {
   if (!interaction.isAnySelectMenu()) return;

   if (!selectsLoaded) {
      await loadSelects(errorHandler);
   }

   await handleSelect(client, errorHandler, interaction);
};
