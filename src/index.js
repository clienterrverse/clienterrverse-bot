import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

if (!process.env.TOKEN) {
  console.error("TOKEN is not defined in the environment variables");
  process.exit(1);
}

(async () => {
  const { default: eventHandler } = await import("./handlers/eventHandler.js");

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildInvites,
    ],
  });
  await eventHandler(client);

  try {
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("Error logging in:", error);
    process.exit(1);
  }
})();

// Regular expression to match the phrase "how to tame koban" ignoring case and special characters
const kobanRegex = /how\s*to\s*tame\s*koban/i;

client.on("messageCreate", (message) => {
  if (kobanRegex.test(message.content)) {
    message.reply(
      "https://cdn.discordapp.com/attachments/1204181585994186832/1243640065301807265/1223554028794024018.png?ex=66523591&is=6650e411&hm=72134eca39e36ebe4e78712523ae120bde69ceb505ea5b5fd2105dd0d727c7a0&"
    );
  }
});

// Regular expression to match the phrase "how to tame koban" ignoring case and special characters
const topregex = /clienterrverse\s*on\s*top/i;

client.on("messageCreate", (message) => {
  if (topregex.test(message.content)) {
    message.reply(
      "https://tenor.com/view/clienterrverse-clienterr-fakepixel-kobe-gif-3978810040281653181"
    );
  }
});

// Regular expression to match the phrase "smash clienterr" ignoring case and special characters
const clienterrregex = /smash\s*clienterr/i;

client.on("messageCreate", (message) => {
  if (clienterrregex.test(message.content)) {
    message.reply(
      "https://tenor.com/view/rule-1-fakepixel-rule-clienterr-clienterr-smash-fakepixel-gif-11287819569727263061"
    );
  }
});

// Regular expression to match the phrase "promote clienterr" ignoring case and special characters
const promoteregex = /promote\s*clienterr/i;

client.on("messageCreate", (message) => {
  if (promoteregex.test(message.content)) {
    message.reply(
      "https://tenor.com/view/promote-clienterr-fakepixel-koban-gif-10325616020765903574 "
    );
  }
});
