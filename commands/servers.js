const { SlashCommandBuilder } = require("discord.js");

// Define the developer's ID
const DEVELOPER_ID = "1215648186643906643";

module.exports = {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("Lists the servers and their invites"),
  async execute(interaction) {
    try {
      // Check if the interaction user is the bot's owner (developer)
      if (interaction.user.id !== DEVELOPER_ID) {
        return await interaction.reply({
          content: "You ain't clienterr bro, you can't use this command!",
          ephemeral: true,
        });
      }

      // Create an embed for the server list
      const embed = {
        color: 0x0099ff,
        title: "Server List",
        description: "List of servers and their invites:",
        fields: [],
      };

      // Iterate through the guilds the bot is in
      for (const [guildId, guild] of interaction.client.guilds.cache) {
        const invites = await guild.invites.fetch();
        const inviteLinks =
          invites
            .map((invite) => `https://discord.gg/${invite.code}`)
            .join("\n") || "No invites";

        // Get the guild's icon URL
        const iconURL = guild.iconURL({ dynamic: true });

        // Add a field for the server with the icon URL
        embed.fields.push({
          name: `${guild.name} (${guild.id})`,
          value: `Members: ${guild.memberCount}\nInvites:\n${inviteLinks}`,
          // Add the server icon as an inline image
          inline: true,
          // Use the guild's icon URL as the image URL
          iconURL: iconURL,
        });
      }

      // If no guilds or invites found
      if (embed.fields.length === 0) {
        embed.fields.push({
          name: "No servers or invites found.",
          value: "\u200B", // Zero-width space
        });
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error("An error occurred:", error);
      await interaction.reply({
        content: "An error occurred while fetching server information.",
        ephemeral: true,
      });
    }
  },
};
