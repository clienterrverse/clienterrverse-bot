const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const profileModel = require("../models/profileSchema");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("admin")
    .setDescription("Access to all the admin commands")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add clienterr coins to a user's balance")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to add clienterr coins to")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of clienterr coins to add")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subtract")
        .setDescription("Subtract clienterr coins from a user's balance")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription(
              "The user you want to subtract clienterr coins from"
            )
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of clienterr coins to subtract")
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const adminSubcommand = interaction.options.getSubcommand();

    if (adminSubcommand === "add") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      await profileModel.findOneAndUpdate(
        {
          userId: user.id,
        },
        {
          $inc: {
            ClienterrCoins: amount,
          },
        }
      );

      await interaction.editReply(
        `Added ${amount} coins to ${user.username}'s balance.`
      );
    }

    if (adminSubcommand === "subtract") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      await profileModel.findOneAndUpdate(
        {
          userId: user.id,
        },
        {
          $inc: {
            ClienterrCoins: -amount, // Subtract the amount
          },
        }
      );

      await interaction.editReply(
        `Subtracted ${amount} clienterr coins from ${user.username}'s balance.`
      );
    }
  },
};
