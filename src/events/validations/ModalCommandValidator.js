/** @format */
import 'colors';
import { EmbedBuilder, Collection, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getModals from '../../utils/getModals.js';

const modals = new Collection();
const cooldowns = new Map();
let modalsLoaded = false;

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
   } catch (error) {
      console.error('Error sending embed reply:'.red, error);
   }
};

const checkPermissions = (member, permissions) =>
   permissions.every((permission) =>
      member.permissions.has(PermissionsBitField.Flags[permission])
   );

const loadModals = async (errorHandler, retryCount = 0) => {
   try {
      const modalFiles = await getModals();
      for (const modal of modalFiles) {
         modal.compiledChecks = {
            userPermissions: modal.userPermissions
               ? (interaction) =>
                    checkPermissions(interaction.member, modal.userPermissions)
               : () => true,
            botPermissions: modal.botPermissions
               ? (interaction) =>
                    checkPermissions(
                       interaction.guild.members.me,
                       modal.botPermissions
                    )
               : () => true,
         };
         modals.set(modal.customId, modal);
      }
      console.log(`Loaded ${modals.size} modal commands`.green);
      modalsLoaded = true;
   } catch (error) {
      errorHandler.handleError(error, { type: 'modalLoad' });
      console.error('Error loading modals:'.red, error);

      if (retryCount < 3) {
         console.log(
            `Retrying modal load... (Attempt ${retryCount + 1})`.yellow
         );
         await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait 5 seconds before retry
         await loadModals(errorHandler, retryCount + 1);
      } else {
         console.error('Failed to load modals after 3 attempts'.red);
      }
   }
};

const handleModal = async (client, errorHandler, interaction) => {
   const { customId } = interaction;
   const modalObject = modals.get(customId);

   if (!modalObject) return;

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
   if (!modalObject.compiledChecks.userPermissions(interaction)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.userNoPermissions
      );
   }

   // Check bot permissions
   if (!modalObject.compiledChecks.botPermissions(interaction)) {
      return sendEmbedReply(
         interaction,
         mConfig.embedColorError,
         mConfig.botNoPermissions
      );
   }

   // Check cooldown
   if (modalObject.cooldown) {
      const cooldownKey = `${interaction.user.id}-${customId}`;
      const cooldownTime = cooldowns.get(cooldownKey);
      if (cooldownTime && Date.now() < cooldownTime) {
         const remainingTime = Math.ceil((cooldownTime - Date.now()) / 1000);
         return sendEmbedReply(
            interaction,
            mConfig.embedColorError,
            `Please wait ${remainingTime} seconds before submitting this modal again.`
         );
      }
      cooldowns.set(cooldownKey, Date.now() + modalObject.cooldown * 1000);
   }

   try {
      await modalObject.run(client, interaction);
      console.log(`Modal ${customId} executed successfully`.green);
   } catch (error) {
      console.error(`Error executing modal ${customId}:`.red, error);

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

   console.log(
      `Modal ${interaction.customId} submitted by ${interaction.user.tag} in ${interaction.guild.name}`
         .yellow
   );

   await handleModal(client, errorHandler, interaction);
};
// TODO List
// 1. **Implement Modal Cache Management**: Consider adding an LRU cache or similar mechanism to manage modal commands, similar to your button cache, to improve performance and memory usage.
// 2. **Add Modal Validation**: Implement validation for modal inputs to ensure they meet the expected format or constraints before processing.
// 3. **Add Unit Tests**: Write unit tests for `loadModals`, `handleModal`, and `sendEmbedReply` functions to ensure correctness and reliability.
// 4. **Logging Enhancements**: Add more detailed logging, such as timestamps and user actions, to help with debugging and monitoring modal interactions.
// 5. **Improve Error Messages**: Customize error messages based on the type of error encountered to provide more context to users and developers.
// 6. **Optimize Retry Logic**: Refactor retry logic to include exponential backoff for handling intermittent issues more gracefully.
// 7. **Add Documentation**: Update the documentation to include details about the new modal system, including usage examples and configuration options.
