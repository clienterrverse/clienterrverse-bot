const { SlashCommandBuilder } = require("discord.js");
const parseMilliseconds = require("parse-ms-2");
const profileModel = require("../models/profileSchema");
const { dailyMin, dailyMax } = require("../globalValues.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Redeem free clienterr coins everyday!"),
  async execute(interaction, profileData) {
    const { id } = interaction.user;
    const { dailyLastUsed } = profileData;

    const cooldown = 86400000;
    const timeLeft = cooldown - (Date.now() - dailyLastUsed);

    if (timeLeft > 0) {
      await interaction.deferReply({ ephemeral: true });
      const { hours, minutes, seconds } = parseMilliseconds(timeLeft);
      return await interaction.editReply(
        `Claim your next daily in ${hours} hrs ${minutes} min ${seconds} sec`
      );
    }

    await interaction.deferReply();

    const randomAmt = Math.floor(
      Math.random() * (dailyMax - dailyMin + 1) + dailyMin
    );

    try {
      await profileModel.findOneAndUpdate(
        { userId: id },
        {
          $set: {
            dailyLastUsed: Date.now(),
          },
          $inc: {
            ClienterrCoins: randomAmt,
          },
        }
      );
    } catch (error) {
      console.log(err);
    }

    await interaction.editReply(
      `You redeemed **${randomAmt} clienterr coins!**`
    );
  },
};
