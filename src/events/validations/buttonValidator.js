/** @format */
import 'colors';
import { EmbedBuilder, Collection, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getButtons from '../../utils/getButtons.js';

const buttons = new Collection();

const loadButtons = async (errorHandler) => {
   try {
      const buttonFiles = await getButtons();
      for (const button of buttonFiles) {
         buttons.set(button.customId, button);
      }
      console.log(`Loaded ${buttons.size} buttons`.green);
   } catch (error) {
      errorHandler.handleError(error, { type: 'buttonLoad' });
      console.error('Error loading buttons:'.red, error);
   }
};

const sendEmbedReply = (interaction, color, description, ephemeral = false) => {
   const embed = new EmbedBuilder()
      .setColor(mConfig.embedColors[color])
      .setDescription(description);
   return interaction.reply({ embeds: [embed], ephemeral });
};

const checkPermissions = (interaction, permissions, type) => {
   const member =
      type === 'user' ? interaction.member : interaction.guild.members.me;
   return permissions.every((permission) =>
      member.permissions.has(PermissionsBitField.Flags[permission])
   );
};

const handleButton = async (client, errorHandler, interaction) => {
   const { customId } = interaction;
   const button = buttons.get(customId);

   if (!button) return;
   const { developersId, testServerId } = config;

   // Check if the button is developer-only
   if (button.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandDevOnly,
         true
      );
   }

   // Check if the button is in test mode
   if (button.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandTestMode,
         true
      );
   }

   // Check user permissions
   if (
      button.userPermissions?.length &&
      !checkPermissions(interaction, button.userPermissions, 'user')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.userNoPermissions,
         true
      );
   }

   // Check bot permissions
   if (
      button.botPermissions?.length &&
      !checkPermissions(interaction, button.botPermissions, 'bot')
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.botNoPermissions,
         true
      );
   }

   // Check if the user is the original interaction user
   if (
      interaction.message.interaction &&
      interaction.message.interaction.user.id !== interaction.user.id
   ) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.cannotUseButton,
         true
      );
   }

   // Check cooldown
   if (button.cooldown) {
      const cooldownKey = `${interaction.user.id}-${customId}`;
      const cooldownTime = buttons.get(cooldownKey);
      if (cooldownTime && Date.now() < cooldownTime) {
         const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            `Please wait ${remainingTime} seconds before using this button again.`,
            true
         );
      }
      buttons.set(cooldownKey, Date.now() + button.cooldown * 1000);
   }

   try {
      console.log(
         `Executing button ${customId} for user ${interaction.user.tag}`.cyan
      );
      await button.run(client, interaction);
   } catch (error) {
      console.error(`Error executing button ${customId}:`.red, error);

      // Use errorHandler to handle the error
      await errorHandler.handleError(error, {
         type: 'buttonError',
         buttonId: customId,
         userId: interaction.user.id,
         guildId: interaction.guild.id,
      });

      sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         'There was an error while executing this button!',
         true
      );
   }
};
let buttonsLoaded = false;

export default async (client, errorHandler, interaction) => {
   if (!interaction.isButton()) return;

   if (!buttonsLoaded) {
      await loadButtons(errorHandler);
      buttonsLoaded = true;
   }

   await handleButton(client, errorHandler, interaction);
};
