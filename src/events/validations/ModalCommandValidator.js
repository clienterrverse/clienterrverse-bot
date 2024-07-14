/** @format */
import 'colors';
import { EmbedBuilder, Collection, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getModals from '../../utils/getModals.js';

const modals = new Collection();
let modalsLoaded = false;

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
   return permissions.every((permission) =>
      member.permissions.has(PermissionsBitField.Flags[permission])
   );
};

const loadModals = async (errorHandler) => {
   try {
      const modalFiles = await getModals();
      for (const modal of modalFiles) {
         modals.set(modal.customId, modal);
      }
      console.log(`Loaded ${modals.size} modal commands`.green);
      modalsLoaded = true;
   } catch (error) {
      errorHandler.handleError(error, { type: 'modalLoad' });
      console.error('Error loading modals:'.red, error);
   }
};

const handleModal = async (client, errorHandler, interaction) => {
   const { customId } = interaction;
   const modalObject = modals.get(customId);

   if (!modalObject) {
      errorHandler.handleError(new Error(`Unknown modal: ${customId}`), {
         type: 'unknownModal',
         modalId: customId,
         userId: interaction.user.id,
         guildId: interaction.guild.id,
      });
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'This modal is not recognized.'
      );
   }

   const { developersId, testServerId } = config;

   // Check if the modal is developer-only
   if (modalObject.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandDevOnly
      );
   }

   // Check if the modal is in test mode
   if (modalObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandTestMode
      );
   }

   // Check user permissions
   if (
      modalObject.userPermissions?.length &&
      !checkPermissions(interaction, modalObject.userPermissions, 'user')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.userNoPermissions
      );
   }

   // Check bot permissions
   if (
      modalObject.botPermissions?.length &&
      !checkPermissions(interaction, modalObject.botPermissions, 'bot')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.botNoPermissions
      );
   }

   // Check cooldown
   if (modalObject.cooldown) {
      const cooldownKey = `${interaction.user.id}-${customId}`;
      const cooldownTime = modals.get(cooldownKey);
      if (cooldownTime && Date.now() < cooldownTime) {
         const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            `Please wait ${remainingTime} seconds before submitting this modal again.`
         );
      }
      modals.set(cooldownKey, Date.now() + modalObject.cooldown * 1000);
   }

   try {
      console.log(
         `Executing modal ${customId} for user ${interaction.user.tag}`.cyan
      );
      await modalObject.run(client, interaction);
      console.log(`Modal ${customId} executed successfully`.green);
   } catch (error) {
      console.error(`Error executing modal ${customId}:`.red, error);

      // Use errorHandler to handle the error
      await errorHandler.handleError(error, {
         type: 'modalError',
         modalId: customId,
         userId: interaction.user.id,
         guildId: interaction.guild.id,
      });

      sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'There was an error while processing this modal submission!'
      );
   }
};

export default async (client, errorHandler, interaction) => {
   if (!interaction.isModalSubmit()) return;

   if (!modalsLoaded) {
      await loadModals(errorHandler);
   }

   // Log modal usage
   console.log(
      `Modal ${interaction.customId} submitted by ${interaction.user.tag} in ${interaction.guild.name}`
         .yellow
   );

   await handleModal(client, errorHandler, interaction);
};
