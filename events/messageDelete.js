module.exports = {
  name: "messageDelete",
  async execute(deletedMessage) {
    // Check if the message was deleted by a bot
    if (deletedMessage.author.bot) return;

    // Fetch the channel where you want to send the deleted messages
    const channelId = "1243098977294090302"; // Replace with your channel ID
    const channel = deletedMessage.guild.channels.cache.get(channelId);

    // Check if the channel exists and the bot has permission to send messages
    if (!channel) {
      console.log(
        "Channel not found or bot lacks permissions to send messages!"
      );
      return;
    }

    // Construct the message information
    const author = deletedMessage.author;
    const content = deletedMessage.content || "*Message content not available*";
    const time = deletedMessage.createdAt.toLocaleString();

    // Construct the message to send
    const messageToSend = `Message deleted by ${author}\nChannel: <#${deletedMessage.channel.id}>\nTime: **${time}**:\nContent: \`\`\`${content}\`\`\``;

    // Send the message to the specified channel
    channel.send(messageToSend);
  },
};
