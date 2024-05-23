const { SlashCommandBuilder } = require("discord.js");
const { EmbedBuilder } = require("@discordjs/builders");
const profileModel = require("../models/profileSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Shows Top 10 Clienterr Coin Earners"),
  async execute(interaction, profileData) {
    await interaction.deferReply();

    const { username, id } = interaction.user;
    const { ClienterrCoins } = profileData;

    let leaderboardEmbed = new EmbedBuilder()
      .setTitle("**Top 10 Clienter Coins Earner**")
      .setColor(0x45d6fd)
      .setFooter({ text: "You are not ranked yet" });

    const members = await profileModel
      .find()
      .sort({ ClienterrCoins: -1 })
      .catch((err) => console.log(err));

    const memberIdx = members.findIndex((member) => member.userId === id);

    leaderboardEmbed.setFooter({
      text: `${username}, you're rank #${
        memberIdx + 1
      } with ${ClienterrCoins} clienterr coins.`,
    });

    const topTen = members.slice(0, 10);

    let desc = "";
    for (let i = 0; i < topTen.length; i++) {
      let { user } = await interaction.guild.members.fetch(topTen[i].userId);
      if (!user) return;
      let userBalance = topTen[i].ClienterrCoins;
      desc += `**${i + 1}. ${
        user.username
      }:** ${userBalance} clienterr coins\n`;
    }
    if (desc !== "") {
      leaderboardEmbed.setDescription(desc);
    }

    await interaction.editReply({ embeds: [leaderboardEmbed] });
  },
};
