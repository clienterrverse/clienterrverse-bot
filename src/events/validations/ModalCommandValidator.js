/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getModals from '../../utils/getModals.js';

const modals = new Collection();

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

const loadModals = async () => {
  const modalFiles = await getModals();
  for (const modal of modalFiles) {
    modals.set(modal.customId, modal);
  }
  console.log(`Loaded ${modals.size} modal commands`.green);
};

const handleModal = async (client, interaction) => {
  const { customId } = interaction;
  const modalObject = modals.get(customId);

  if (!modalObject) return;

  const { developersId, testServerId } = config;

  if (modalObject.devOnly && !developersId.includes(interaction.user.id)) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.commandDevOnly
    );
  }

  if (modalObject.testMode && interaction.guild.id !== testServerId) {
    return sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      mConfig.commandTestMode
    );
  }

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

  try {
    await modalObject.run(client, interaction);
    console.log(
      `Modal command executed: ${customId} by ${interaction.user.tag}`.green
    );
  } catch (error) {
    console.error(`Error executing modal command ${customId}:`.red, error);
    sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      'There was an error while processing this modal submission!'
    );
  }
};

export default async (client, interaction) => {
  if (!interaction.isModalSubmit()) return;

  await loadModals();

  await handleModal(client, interaction);
};
