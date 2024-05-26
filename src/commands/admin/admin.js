/** @format */

import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ApplicationCommandOptionType,
} from "discord.js";
import profileModel from "../../schemas/profileSchema.js";

export default {
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
    )
    .toJSON(),

  userPermissions: [PermissionFlagsBits.Administrator], // Require administrator permission
  botPermissions: [], // No bot permissions required
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  // Function to be executed when the command is used
  run: async (client, interaction) => {
    const adminSubcommand = interaction.options.getSubcommand();
    await interaction.deferReply();

    if (adminSubcommand === "add") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      await profileModel.findOneAndUpdate(
        { userId: user.id },
        { $inc: { ClienterrCoins: amount } }
      );

      // Send success message
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
}
