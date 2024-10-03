/** @format */
import {
  EmbedBuilder,
  ActionRowBuilder,
  RoleSelectMenuBuilder,
} from 'discord.js';
import { comprehensiveVoiceCheck } from '../utils/join-to-system/checkChannelOwnership.js';

export default {
  customId: 'manage_roles',
  userPermissions: [],
  botPermissions: [],

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
            'You do not have permission to manage roles in this channel.',
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

      // Create the role select menu
      const selectMenu = new RoleSelectMenuBuilder()
        .setCustomId('role_manage')
        .setPlaceholder('Select a role to manage')
        .setMinValues(1)
        .setMaxValues(1);

      // Create an action row and add the select menu to it
      const actionRow = new ActionRowBuilder().addComponents(selectMenu);

      // Create an embed for the interaction response
      const embed = new EmbedBuilder()
        .setTitle('Manage Channel Roles')
        .setDescription(
          'Select a role to grant or remove access to the channel.'
        )
        .setColor('Blue')
        .addFields(
          { name: 'Channel', value: voiceChannel.name, inline: true },
          {
            name: 'Current Permissions',
            value: 'Use the menu to view and modify role permissions.',
            inline: true,
          }
        )
        .setFooter({ text: 'Select a role to manage its permissions' });

      // Reply to the interaction with the embed and action row
      await interaction.reply({
        embeds: [embed],
        components: [actionRow],
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error in manage_roles interaction:', error);
      await interaction.reply({
        content:
          'An error occurred while processing your request. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
