/** @format */
import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getButtons from '../../utils/getButtons.js';

const buttons = new Collection();

// Load buttons once at the start and cache them
const loadButtons = async () => {
   try {
      const buttonFiles = await getButtons();
      for (const button of buttonFiles) {
         buttons.set(button.customId, button);
      }
      console.log(`Loaded ${buttons.size} buttons`.green);
   } catch (error) {
      console.error('Error loading buttons:'.red, error);
   }
};

// Initialize buttons when the module is loaded
loadButtons();

const sendEmbedReply = (interaction, color, description, ephemeral = false) => {
   const embed = new EmbedBuilder()
      .setColor(mConfig.embedColors[color])
      .setDescription(description);
   return interaction.reply({ embeds: [embed], ephemeral });
};

const checkPermissions = (interaction, permissions, type) => {
   const member =
      type === 'user' ? interaction.member : interaction.guild.members.me;
   return permissions.every((permission) => member.permissions.has(permission));
};

const handleButton = async (client, errorHandler, interaction) => {
   const { customId } = interaction;
   const button = buttons.get(customId);

   if (!button) return;

   const { developersId, testServerId } = config;

   if (button.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandDevOnly,
         true
      );
   }

   if (button.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.commandTestMode,
         true
      );
   }

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

   try {
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

export default async (client, errorHandler, interaction) => {
   if (!interaction.isButton()) return;
   await handleButton(client, errorHandler, interaction);
};
