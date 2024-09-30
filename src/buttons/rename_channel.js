/** @format */
import {
  PermissionsBitField,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';
import joinToSystemSchema from '../schemas/joinToSystemSchema.js';

export default {
  customId: 'rename_channel',
  userPermissions: [],
  botPermissions: [PermissionsBitField.Flags.ManageChannels],

  run: async (client, interaction) => {
    try {
      // Perform comprehensive checks
      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        !checkResult.isOwner
      ) {
        return interaction.reply({
          content:
            checkResult.message ||
            (mconfig.errors?.notOwner ?? defaultMessages.errors.notOwner),
          ephemeral: true,
        });
      }

      const voiceChannel = interaction.member.voice.channel;

      if (!voiceChannel) {
        return interaction.reply({
          content: 'You are not in a voice channel.',
          ephemeral: true,
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('rename_channel_modal')
        .setTitle('Rename Voice Channel');

      const nameInput = new TextInputBuilder()
        .setCustomId('new_channel_name')
        .setLabel('New channel name:')
        .setPlaceholder('Enter new name for the channel')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(100)
        .setRequired(true);

      const actionRow = new ActionRowBuilder().addComponents(nameInput);
      modal.addComponents(actionRow);

      await interaction.showModal(modal);

      const filter = (i) => i.customId === 'rename_channel_modal';
      const modalSubmission = await interaction
        .awaitModalSubmit({ filter, time: 60000 })
        .catch(() => null);

      if (!modalSubmission) {
        return interaction.followUp({
          content:
            'You took too long to provide a new name. The channel was not renamed.',
          ephemeral: true,
        });
      }

      const newName =
        modalSubmission.fields.getTextInputValue('new_channel_name');

      // Rename the channel
      await voiceChannel.setName(newName);

      // Update the database
      await joinToSystemSchema.updateOne(
        { channelId: voiceChannel.id },
        { channelName: newName }
      );

      return modalSubmission.reply({
        content: `The voice channel has been renamed to "${newName}".`,
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
