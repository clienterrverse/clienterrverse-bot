export default async (client, message) => {
  // Define regular expressions and their corresponding actions
  const actions = [
    {
      regex: /how\s*to\s*tame\s*koban/i,
      action: () => {
        message.reply(
          `<:whip:1223554028794024018>`
        );
      },
    },
    {
      regex: /smash\s*clienterr/i,
      action: () => {
        message.reply(
          "https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061"
        );
      },
    },
    {
      regex: /promote\s*clienterr/i,
      action: () => {
        message.reply(
          "https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574"
        );
      },
    },
    {
      regex: /clienterrverse\s*on\s*top/i,
      action: () => {
        message.reply(
          "https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181"
        );
      },
    },
    {
      regex: /how\s*to\s*tame\s*regasky/i,
      action: () => {
        message.reply(
          `<:whip:1223554028794024018>`
        );
      },
    }
  ];

  // Check message content against all defined regular expressions
  for (const { regex, action } of actions) {
    if (regex.test(message.content)) {
      action();
      break; // Stop checking once a match is found
    }
  }
};
