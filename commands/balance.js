const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Shows a user their balance"),
  async execute(interaction, profileData) {
    const { ClienterrCoins } = profileData;
    const username = interaction.user.username;

    await interaction.reply({
      content: `${username} has ${ClienterrCoins} clienterr coins.`,
      ephemeral: true,
    });
  },
};
