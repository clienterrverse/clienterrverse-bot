/**
 * The emoji to react with when mentioned.
 * @type {string}
 */
const REACTION_EMOJI = '👋';

/**
 * The chance to reply with a message when mentioned.
 * @type {number}
 */
const REPLY_CHANCE = 0.3; // 10% chance to reply with a message

/**
 * The list of random replies to use when replying.
 * @type {string[]}
 */
const RANDOM_REPLIES = [
  'Hello there!',
  'How can I help you today?',
  'Nice to see you!',
  "What's on your mind?",
  "I'm all ears!",
];

/**
 * Checks if the message is a direct mention to the bot.
 * @param {Message} message - The message to check.
 * @param {Client} client - The client instance.
 * @returns {boolean} - Whether the message is a direct mention to the bot.
 */
const isDirectMention = (message, client) =>
  message.mentions.has(client.user) &&
  message.author.id !== client.user.id &&
  !message.content.match(/@(everyone|here)/gi);

/**
 * Gets a random reply from the list of random replies.
 * @returns {string} - A random reply.
 */
const getRandomReply = () =>
  RANDOM_REPLIES[Math.floor(Math.random() * RANDOM_REPLIES.length)];

/**
 * Handles the message when the bot is mentioned.
 * @param {Message} message - The message to handle.
 * @param {Client} client - The client instance.
 */
const handleMessage = async (message, client) => {
  if (
    message.author.bot ||
    message.reference ||
    !isDirectMention(message, client)
  ) {
    return;
  }

  try {
    await message.react(REACTION_EMOJI);

    if (Math.random() < REPLY_CHANCE) {
      const reply = getRandomReply();
      await message.reply(reply);
    }
  } catch (error) {
    console.error('Error processing message:', error);
    //  errorHandler.handleError(error, { type: 'messageProcessing', messageId: message.id });
  }
};

/**
 * The default export function for the reactMention event.
 * @param {Client} client - The client instance.
 * @param {ErrorHandler} errorHandler - The error handler instance.
 * @param {Message} message - The message to handle.
 */
export default async (client, errorHandler, message) => {
  await handleMessage(message, client);
};
