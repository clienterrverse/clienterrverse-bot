/**
 * This module handles chat events related to clienterr actions.
 * It defines a set of emojis and GIFs as constants, and a list of actions
 * that can be triggered by specific keywords in chat messages. When an action
 * is triggered, the corresponding emoji or GIF is sent as a reply to the message.
 */

// Define emoji and GIF URLs as constants
const EMOJIS = {
  /**
   * The whip emoji.
   */
  whip: '<:whip:1223554028794024018>',
};

const GIFS = {
  /**
   * The GIF for smashing clienterr.
   */
  smashClienterr:
    'https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061',
  /**
   * The GIF for promoting clienterr.
   */
  promoteClienterr:
    'https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574',
  /**
   * The GIF for clienterrverse on top.
   */
  clienterrverseOnTop:
    'https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181',
  /**
   * The GIF for taming Nory.
   */
  tameNory:
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTF4eGs3Y2U4bHY0b2FkeGpkaXgwZjdxcGE4d2xnNjlvM2o0cnVpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HOTfzC3IjaJxK/giphy.webp',
  /**
   * The GIF for demoting clienterr.
   */
  demoteclienterr:
    'https://tenor.com/view/clienterr-fakepixel-demo-pls-gif-10228665671878098589',
};

// Define actions in a more structured way
const ACTIONS = [
  {
    /**
     * Regular expression to match messages asking how to tame specific entities.
     */
    regex: /how\s*to\s*tame\s*(koban|ChronoUK|regasky|darkgladiator)/i,
    /**
     * The response to send when the above regex matches.
     */
    response: EMOJIS.whip,
  },
  {
    /**
     * Regular expression to match messages asking to smash clienterr.
     */
    regex: /smash\s*clienterr/i,
    /**
     * The response to send when the above regex matches.
     */
    response: GIFS.smashClienterr,
  },
  {
    /**
     * Regular expression to match messages asking to promote clienterr.
     */
    regex: /promote\s*clienterr/i,
    /**
     * The response to send when the above regex matches.
     */
    response: GIFS.promoteClienterr,
  },
  {
    /**
     * Regular expression to match messages asking about clienterrverse on top.
     */
    regex: /clienterrverse\s*on\s*top/i,
    /**
     * The response to send when the above regex matches.
     */
    response: GIFS.clienterrverseOnTop,
  },
  {
    /**
     * Regular expression to match messages asking how to tame Nory.
     */
    regex: /how\s*to\s*tame\s*(nory|norysight)/i,
    /**
     * The response to send when the above regex matches.
     */
    response: GIFS.tameNory,
  },
  {
    /**
     * Regular expression to match messages asking to demote clienterr.
     */
    regex: /demote\s*clienterr/i,
    /**
     * The response to send when the above regex matches.
     */
    response: GIFS.demoteclienterr,
  },
];

/**
 * Handles sending a response to a message based on the action triggered.
 *
 * @param {Message} message - The message that triggered the action.
 * @param {String} response - The response to send.
 */
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

/**
 * The main function that processes chat messages and triggers actions.
 *
 * @param {Client} client - The Discord client.
 * @param {Function} errorHandler - The error handler function.
 * @param {Message} message - The message to process.
 */
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
