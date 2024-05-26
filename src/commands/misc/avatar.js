/** @format */
// Credit: This code is adapted from the Nory bot

import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

// Export the modulFe to be used elsewhere
export default {
  // Slash command data
  data: new SlashCommandBuilder()
    .setName("avatar") // Sets the command name
    .setDescription("Show avatar of any user") // Sets the command description
    .addUserOption((option) =>
      option
        .setName("user") // Adds a user option to specify the user whose avatar to show
        .setDescription("User whose avatar you want to see:") // Option description
        .setRequired(true)
    ), // Option is required

  userPermissions: [], // No user permissions required
  botPermissions: [], // No bot permissions required
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  // Function to be executed when the command is used
  run: async (client, interaction) => {
    try {
      // Get the specified user
      const user = interaction.options.getUser("user");
      // Get the member from the guild or interaction member
      const member =
        interaction.guild.members.cache.find((m) => m.user.id === user.id) ||
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
      console.error(`An error occurred in the avatar command: ${error}`);
      // Send an error message if an error occurs
      await interaction.reply({
        content:
          "An error occurred while processing your command. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
