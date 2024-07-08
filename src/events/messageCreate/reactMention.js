const REACTION_EMOJI = '👋';
const REPLY_CHANCE = 0.1; // 10% chance to reply with a message

const randomReplies = [
  'Hello there!',
  'How can I help you today?',
  'Nice to see you!',
  "What's on your mind?",
  "I'm all ears!",
];

export default async (client, message) => {
  if (message.author.bot) return;

  const isDirectMention =
    message.mentions.has(client.user) &&
    message.author.id !== client.user.id &&
    !message.content.match(/@(everyone|here)/gi);

  if (!message.reference && isDirectMention) {
    try {
      await message.react(REACTION_EMOJI);

      if (Math.random() < REPLY_CHANCE) {
        const reply =
          randomReplies[Math.floor(Math.random() * randomReplies.length)];
        await message.reply(reply);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      // Optionally, you could send an error message to a logging channel
      // await client.channels.cache.get('LOGGING_CHANNEL_ID').send(`Error: ${error.message}`);
    }
  }

  // Add cooldown for user mentions
  if (!client.mentionCooldowns) client.mentionCooldowns = new Map();
  if (isDirectMention) {
    const now = Date.now();
    const cooldownAmount = 60000; // 1 minute cooldown
    if (client.mentionCooldowns.has(message.author.id)) {
      const expirationTime =
        client.mentionCooldowns.get(message.author.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        return message.reply(
          `Please wait ${timeLeft.toFixed(1)} more seconds before mentioning me again.`
        );
      }
    }
    client.mentionCooldowns.set(message.author.id, now);
  }
};
