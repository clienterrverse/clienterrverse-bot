import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';

import mConfig from '../config/messageConfig.json' assert { type: 'json' };

export default {
  data: new ContextMenuCommandBuilder()
    .setName("User Avatar")
    .setType(ApplicationCommandType.User),
  userPermissions: [PermissionFlagsBits.ManageMessages],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const member =
        interaction.guild.members.cache.find((m) => m.user.id === interaction.user.id) ||
        interaction.member;

      // Get the avatar URL of the user
      const avatar = member.user.displayAvatarURL({
        format: "png",
        dynamic: true,
        size: 1024,
      });

      // Construct embed to display the user's avatar
      const embed = new EmbedBuilder()
        .setTitle(`${member.user.username}'s Avatar`) // Set the title as the username followed by "Avatar"
        .setURL(avatar) // Set the URL of the embed to the avatar URL
        .setImage(avatar) // Set the image of the embed to the avatar URL
        .setFooter({
          text: `Requested by ${interaction.user.username}`, // Set the footer text as the username of the requester
          iconURL: interaction.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          }), // Set the footer icon as the requester's avatar
        })
        .setColor("#eb3434"); // Set the embed color

      // Send the embed containing the user's avatar as a reply
      await interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.log(error);
    }
  },
};
