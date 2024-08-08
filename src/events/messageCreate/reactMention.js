const REACTION_EMOJI = '👋';
const REPLY_CHANCE = 0.3; // 10% chance to reply with a message

const RANDOM_REPLIES = [
   'Hello there!',
   'How can I help you today?',
   'Nice to see you!',
   "What's on your mind?",
   "I'm all ears!",
];

const isDirectMention = (message, client) =>
   message.mentions.has(client.user) &&
   message.author.id !== client.user.id &&
   !message.content.match(/@(everyone|here)/gi);

const getRandomReply = () =>
   RANDOM_REPLIES[Math.floor(Math.random() * RANDOM_REPLIES.length)];

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

export default async (client, errorHandler, message) => {
   await handleMessage(message, client);
};
