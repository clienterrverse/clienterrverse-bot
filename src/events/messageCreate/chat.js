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
      response: EMOJIS.whip,
   },
   {
      regex: /smash\s*clienterr/i,
      response: GIFS.smashClienterr,
   },
   {
      regex: /promote\s*clienterr/i,
      response: GIFS.promoteClienterr,
   },
   {
      regex: /clienterrverse\s*on\s*top/i,
      response: GIFS.clienterrverseOnTop,
   },
   {
      regex: /how\s*to\s*tame\s*(nory|norysight)/i,
      response: GIFS.tameNory,
   },
   {
      regex: /demote\s*clienterr/i,
      response: GIFS.demoteclienterr,
   },
];

const handleAction = async (message, response) => {
   try {
      await message.reply(response);
   } catch (error) {
      console.error('Error sending message:', error);
      await message.channel.send(
         'Oops! Something went wrong while processing your request.'
      );
   }
};

export default async (client, errorHandler, message) => {
   try {
      const action = ACTIONS.find(({ regex }) => regex.test(message.content));
      if (action) {
         await handleAction(message, action.response);
      }
   } catch (error) {
      errorHandler.handleError(error, { type: 'chatrega' });
   }
};
