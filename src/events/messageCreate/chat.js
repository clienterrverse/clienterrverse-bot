export default async (client, message) => {
  const whipEmoji = `<:whip:1223554028794024018>`;

  // Define regular expressions and their corresponding actions
  const actions = [
    {
      regex: /how\s*to\s*tame\s*koban/i,
      action: async () => {
        await message.reply(whipEmoji);
      },
    },
    {
      regex: /how\s*to\s*tame\s*ChronoUK/i,
      action: async () => {
        await message.reply(whipEmoji);
      },
    },
    {
      regex: /smash\s*clienterr/i,
      action: async () => {
        await message.reply(
          'https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061'
        );
      },
    },
    {
      regex: /promote\s*clienterr/i,
      action: async () => {
        await message.reply(
          'https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574'
        );
      },
    },
    {
      regex: /clienterrverse\s*on\s*top/i,
      action: async () => {
        await message.reply(
          'https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181'
        );
      },
    },
    {
      regex: /how\s*to\s*tame\s*regasky/i,
      action: async () => {
        await message.reply(whipEmoji);
      },
    },
    {
      regex: /how\s*to\s*tame\s*darkgladiator/i,
      action: async () => {
        await message.reply(whipEmoji);
      },
    },
    {
      regex: /how\s*to\s*tame\s*(nory|norysight)/i,
      action: async () => {
        await message.reply(
          'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExeTF4eGs3Y2U4bHY0b2FkeGpkaXgwZjdxcGE4d2xnNjlvM2o0cnVpZiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/HOTfzC3IjaJxK/giphy.webp'
        );
      },
    },
  ];

  // Check message content against all defined regular expressions
  for (const { regex, action } of actions) {
    if (regex.test(message.content)) {
      await action();
      break; // Stop checking once a match is found
    }
  }
};
