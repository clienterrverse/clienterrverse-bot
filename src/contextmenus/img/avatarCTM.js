import {
  ContextMenuCommandBuilder,
  ApplicationCommandType,
  EmbedBuilder,
} from 'discord.js';

export default {
  data: new ContextMenuCommandBuilder()
    .setName('User Avatar')
    .setType(ApplicationCommandType.User),
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const user = interaction.targetUser;

      // Get the avatar URL of the targeted user
      const avatar = user.displayAvatarURL({
        format: 'png',
        dynamic: true,
        size: 1024,
      });

      // Construct embed to display the targeted user's avatar
      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'s Avatar`) // Set the title as the username followed by "Avatar"
        .setURL(avatar) // Set the URL of the embed to the avatar URL
        .setImage(avatar) // Set the image of the embed to the avatar URL
        .setFooter({
          text: `Requested by ${interaction.user.username}`, // Set the footer text as the username of the requester
          iconURL: interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 1024,
          }), // Set the footer icon as the requester's avatar
        })
        .setColor('#eb3434'); // Set the embed color

      // Send the embed containing the targeted user's avatar as a reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.log(error);
    }
  },
};
