
export default async (client, message) => {
  // Ignore messages from other bots
  if (message.author.bot) return;

  // Flag indicating if the message is a direct mention of the bot, excluding @everyone and @here
  const isDirectMention =
    message.mentions.has(client.user) &&
    message.author.id !== client.user.id &&
    !message.content.match(/(@)?(everyone|here)/gi);

  // Check if the message is not a reply and is a direct mention
  if (!message.reference && isDirectMention) {
    try {
      // Add your preferred emoji reaction
      await message.react("👋");
    } catch (error) {
      console.error("Error reacting to message:", error);
    }
  }
};
