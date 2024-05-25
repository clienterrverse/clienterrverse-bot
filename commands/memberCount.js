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

    // Respond with the member count including bots
    await interaction.reply(
      `This server currently has **${memberCount} members**, including **${botCount} bots**.`
    );
  },
};
