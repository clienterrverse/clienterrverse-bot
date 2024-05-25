const { SlashCommandBuilder } = require("discord.js");
const MessageCount = require("../models/messageCount");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("messages")
    .setDescription("Get the number of messages sent by a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the message count for")
        .setRequired(true)
    ),
  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const userId = user.id;
    const guildId = interaction.guild.id;

    // Message count logic
    try {
      const userId = user.id;
      const userName = user.username;
      const guildId = interaction.guild.id;
      await MessageCount.findOneAndUpdate(
        { userId, guildId },
        { $inc: { messageCount: 1 }, userName },
        { new: true, upsert: true }
      );
    } catch (error) {
      console.error("Error updating message count:", error);
    }

    // Retrieve message count
    let messageCount = 0;
    try {
      const userRecord = await MessageCount.findOne({ userId, guildId });
      messageCount = userRecord ? userRecord.messageCount : 0;
    } catch (error) {
      console.error("Error fetching message count:", error);
    }

    // Create and send embed
    const message = `${user.username} has sent **${messageCount} messages** in this server.`;
    await interaction.reply({ content: message });
  },
};
