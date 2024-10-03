import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from 'discord.js';
import JoinToSystemChannel from '../schemas/joinToSystemSchema.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
  customId: 'set_limit_modal',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const checkResult = await comprehensiveVoiceCheck(
        interaction.user.id,
        interaction.member
      );

      if (
        !checkResult.inVoice ||
        !checkResult.isManaged ||
        !checkResult.isOwner
      ) {
        return await interaction.editReply({
          content:
            checkResult.message ||
            'You do not have permission to manage this channel.',
        });
      }

      const userLimit = interaction.fields.getTextInputValue('user_limit');
      const limitNumber = parseInt(userLimit, 10);

      if (isNaN(limitNumber) || limitNumber < 0 || limitNumber > 99) {
        return await interaction.editReply({
          content:
            'Please enter a valid number between 0 and 99. (0 means no limit)',
        });
      }

      const member = await interaction.guild.members
        .fetch(interaction.user.id)
        .catch(() => null);
      if (!member) {
        return await interaction.editReply({
          content: 'Failed to fetch your member information. Please try again.',
        });
      }

      const voiceChannel = member.voice.channel;
      if (!voiceChannel) {
        return await interaction.editReply({
          content: 'You need to be in a voice channel to set the user limit.',
        });
      }

      await voiceChannel.setUserLimit(limitNumber).catch((error) => {
        console.error('Error setting user limit:', error);
        throw new Error('Failed to set user limit for the voice channel.');
      });

      const channelDoc = await JoinToSystemChannel.findOneAndUpdate(
        { channelId: voiceChannel.id },
        { userLimit: limitNumber },
        { new: true, upsert: true }
      ).catch((error) => {
        console.error('Error updating database:', error);
        throw new Error(
          'Failed to update the database with the new user limit.'
        );
      });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('User Limit Updated')
        .setDescription(
          `The user limit for this voice channel has been set to ${limitNumber}.`
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}` })
        .setTimestamp();

      const resetButton = new ButtonBuilder()
        .setCustomId('reset_user_limit')
        .setLabel('Reset Limit')
        .setStyle(ButtonStyle.Secondary);

      const row = new ActionRowBuilder().addComponents(resetButton);

      await interaction.editReply({
        embeds: [embed],
        components: [row],
      });
    } catch (error) {
      console.error('Error in set_limit_modal:', error);

      const errorMessage =
        error.message ||
        'An unexpected error occurred while processing your request.';

      await interaction
        .editReply({
          content: `${errorMessage} Please try again later.`,
        })
        .catch(console.error);
    }
  },
};
