const REACTION_EMOJI = '👋';
const REPLY_CHANCE = 0.1; // 10% chance to reply with a message

const randomReplies = [
   'Hello there!',
   'How can I help you today?',
   'Nice to see you!',
   "What's on your mind?",
   "I'm all ears!",
];

export default async (client, errorHandler, message) => {
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
      }
   }
};
