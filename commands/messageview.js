const { SlashCommandBuilder } = require("discord.js");
const MessageCount = require("../models/messageCount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("message")
    .setDescription("Manage the number of messages sent by a user")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View the message count of a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user to view the message count of")
        )
    ),
  async execute(interaction) {
    await interaction.deferReply();

    try {
      let userId;
      if (interaction.options.getUser("user")) {
        userId = interaction.options.getUser("user").id;
      } else {
        userId = interaction.user.id;
      }

      const guildId = interaction.guild.id;

      let messageCount = await MessageCount.findOne({ userId, guildId });

      if (!messageCount) {
        // If message count is not found, create a new entry with default message count of 0
        messageCount = await MessageCount.create({
          userId,
          guildId,
          messageCount: 0,
        });
      }

      await interaction.editReply(
        `The user has sent **${messageCount.messageCount} messages** in this server.`
      );
    } catch (error) {
      console.error("Error fetching message count:", error);
      await interaction.editReply("Failed to fetch message count.");
    }
  },
};
