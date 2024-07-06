/** @format */

import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import getSelects from '../../utils/getSelects.js';

const selects = new Collection();

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

const loadSelects = async () => {
  const selectFiles = await getSelects();
  for (const select of selectFiles) {
    selects.set(select.customId, select);
  }
  console.log(`Loaded ${selects.size} select menu commands`.green);
};

const handleSelect = async (client, interaction) => {
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

  if (selectObject.testMode && interaction.guild.id !== testServerId) {
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

  try {
    await selectObject.run(client, interaction);
    console.log(
      `Select menu executed: ${customId} by ${interaction.user.tag}`.green
    );
  } catch (error) {
    console.error(`Error executing select menu ${customId}:`.red, error);
    sendEmbedReply(
      interaction,
      mConfig.embedColorError,
      'There was an error while processing this select menu!'
    );
  }
};

export default async (client, interaction) => {
  if (!interaction.isAnySelectMenu()) return;
  await loadSelects();

  await handleSelect(client, interaction);
};
