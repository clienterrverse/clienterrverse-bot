// Define emoji and GIF URLs as constants
const EMOJIS = {
   whip: '<:whip:1223554028794024018>',
};

const GIFS = {
   smashClienterr:
      'https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061',
   promoteClienterr:
      'https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574',
   clienterrverseOnTop:
      'https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181',
   tameNory:
      'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTF4eGs3Y2U4bHY0b2FkeGpkaXgwZjdxcGE4d2xnNjlvM2o0cnVpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HOTfzC3IjaJxK/giphy.webp',
   demoteclienterr:
      'https://tenor.com/view/clienterr-fakepixel-demo-pls-gif-10228665671878098589',
};

// Define actions in a more structured way
const ACTIONS = [
   {
      regex: /how\s*to\s*tame\s*(koban|ChronoUK|regasky|darkgladiator)/i,
      action: async (message) => message.reply(EMOJIS.whip),
   },
   {
      regex: /smash\s*clienterr/i,
      action: async (message) => message.reply(GIFS.smashClienterr),
   },
   {
      regex: /promote\s*clienterr/i,
      action: async (message) => message.reply(GIFS.promoteClienterr),
   },
   {
      regex: /clienterrverse\s*on\s*top/i,
      action: async (message) => message.reply(GIFS.clienterrverseOnTop),
   },
   {
      regex: /how\s*to\s*tame\s*(nory|norysight)/i,
      action: async (message) => message.reply(GIFS.tameNory),
   },
   {
      regex: /demote\s*clienterr/i,
      action: async (message) => message.reply(GIFS.demoteclienterr),
   },
];

export default async (client, errorHandler, message) => {
   try {
      // Check message content against all defined regular expressions
      for (const { regex, action } of ACTIONS) {
         if (regex.test(message.content)) {
            await action(message);
            break; // Stop checking once a match is found
         }
      }
   } catch (error) {
      console.error('Error processing message:', error);
      // Optionally, send an error message to the channel
      await message.channel.send(
         'Oops! Something went wrong while processing your message.'
      );
   }
};
