const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with the Bot's ping and the Discord API latency"),
  async execute(interaction) {
    const botPing = interaction.client.ws.ping;
    const apiLatency = Date.now() - interaction.createdTimestamp;

    await interaction.reply(
      `**Bot ping**: ${botPing}ms\n**API latency**: ${apiLatency}ms`
    );
  },
};
