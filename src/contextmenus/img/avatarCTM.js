import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} from 'discord.js';

/**
 * Represents the User Avatar context menu command.
 * This command displays the avatar of a targeted user in a Discord server.
 */
export default {
  /**
   * The data for the context menu command.
   * @type {ContextMenuCommandBuilder}
   */
  data: new ContextMenuCommandBuilder()
    .setName('User Avatar') // Sets the name of the command to "User Avatar"
    .setType(ApplicationCommandType.User), // Specifies the type of the command as User

  /**
   * The permissions required by the user to use this command.
   * @type {string[]}
   */
  userPermissions: [],

  /**
   * The permissions required by the bot to use this command.
   * @type {string[]}
   */
  botPermissions: [],

  /**
   * Executes the command.
   * @param {Client} client - The Discord client instance.
   * @param {Interaction} interaction - The interaction that triggered the command.
   */
  run: async (client, interaction) => {
    try {
      const user = interaction.targetUser; // Retrieves the targeted user

      // Retrieves the avatar URL of the targeted user
      const avatar = user.displayAvatarURL({
        format: 'png', // Sets the format of the avatar to PNG
        dynamic: true, // Allows the avatar to be dynamic
        size: 1024, // Sets the size of the avatar to 1024x1024
      });

      // Constructs an embed to display the targeted user's avatar
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar`) // Sets the title of the embed to the username followed by "Avatar"
        .setURL(avatar) // Sets the URL of the embed to the avatar URL
        .setImage(avatar) // Sets the image of the embed to the avatar URL
        .setFooter({
          text: `Requested by ${interaction.user.username}`, // Sets the footer text to the username of the requester
          iconURL: interaction.user.displayAvatarURL({
            format: 'png', // Sets the format of the footer icon to PNG
            dynamic: true, // Allows the footer icon to be dynamic
            size: 1024, // Sets the size of the footer icon to 1024x1024
          }), // Sets the footer icon to the requester's avatar
        })
        .setColor('#eb3434'); // Sets the color of the embed

      // Sends the embed containing the targeted user's avatar as a reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error); // Logs any errors that occur during the execution of the command
    }
  },
};
