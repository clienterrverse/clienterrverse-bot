const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("membercount")
    .setDescription("Displays the member count of the server, including bots"),
  async execute(interaction) {
    // Fetch the guild to get the member count
    const guild = interaction.guild;

    // Fetch the total member count and bot count separately
    const memberCount = guild.memberCount;
    const botCount = guild.members.cache.filter(
      (member) => member.user.bot
    ).size;

    // Get the server's name
    const serverName = guild.name;

    // Respond with the member count including bots and the server's name
    await interaction.reply(
      `**${serverName}** currently has **${memberCount} members**.`
    );
  },
};
