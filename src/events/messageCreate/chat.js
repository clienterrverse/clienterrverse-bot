export default async (client, message) => {
  // Define regular expressions and their corresponding actions
  const actions = [
    {
      regex: /how\s*to\s*tame\s*koban/i,
      action: () => {
        message.reply(
          "https://cdn.discordapp.com/attachments/1204181585994186832/1243640065301807265/1223554028794024018.png?ex=66523591&is=6650e411&hm=72134eca39e36ebe4e78712523ae120bde69ceb505ea5b5fd2105dd0d727c7a0&"
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
  ];

  // Check message content against all defined regular expressions
  for (const { regex, action } of actions) {
    if (regex.test(message.content)) {
      action();
      break; // Stop checking once a match is found
    }
  }
};
