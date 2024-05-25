const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const MessageCount = require("../models/messageCount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("messages")
    .setDescription("Manage the number of messages sent by a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add messages to a user's message count")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to add messages to")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The number of messages to add")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("subtract")
        .setDescription("Subtract messages from a user's message count")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to subtract messages from")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The number of messages to subtract")
            .setRequired(true)
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "add" || subcommand === "subtract") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");
      const userId = user.id;
      const guildId = interaction.guild.id;

      try {
        await MessageCount.findOneAndUpdate(
          { userId, guildId },
          { $inc: { messageCount: subcommand === "add" ? amount : -amount } },
          { new: true, upsert: true }
        );

        await interaction.editReply(
          `${
            subcommand === "add" ? "Added" : "Subtracted"
          } **${amount} messages** from **<@${userId}>** message count.`
        );
      } catch (error) {
        console.error(`Error ${subcommand}ing messages:`, error);
        await interaction.editReply(`Failed to ${subcommand} messages.`);
      }
    }
  },
};
