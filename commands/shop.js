const { SlashCommandBuilder } = require("discord.js");
const profileModel = require("../models/profileSchema");
const { customRoleCost } = require("../shopPrices.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("A shop where you can spend your Clienterr Coins")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("custom-role")
        .setDescription(
          `Buy a custom role for ${customRoleCost} Clienterr Coins`
        )
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Choose the name of your role")
            .setMinLength(2)
            .setMaxLength(15)
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("color")
            .setDescription("Choose the color for your role")
            .addChoices(
              { name: "Red", value: "FF0000" },
              { name: "Cyan", value: "00FFFF" },
              { name: "Blue", value: "0000FF" },
              { name: "Yellow", value: "FFFF00" },
              { name: "Magenta", value: "FF00FF" }
            )
            .setRequired(true)
        )
    ),

  async execute(interaction, profileData) {
    const { ClienterrCoins, userId } = profileData;
    const shopCommand = interaction.options.getSubcommand();

    if (shopCommand === "custom-role") {
      const name = interaction.options.getString("name");
      const color = interaction.options.getString("color");

      if (ClienterrCoins < customRoleCost) {
        await interaction.deferReply({ ephemeral: true });
        return await interaction.editReply(
          `You need ${customRoleCost} Clienterr Coins to buy a custom role`
        );
      }

      await interaction.deferReply();

      const customRole = await interaction.guild.roles.create({
        name,
        permissions: [],
        color,
      });

      await interaction.member.roles.add(customRole);

      await profileModel.findOneAndUpdate(
        {
          userId: interaction.user.id,
        },
        {
          $inc: {
            ClienterrCoins: -customRoleCost,
          },
        }
      );

      await interaction.editReply("Successfully purchased a custom role!");
    }
  },
};
