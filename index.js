require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");

const token = process.env.DISCORD_TOKEN;
const database = process.env.MONGODB_SRV;

// Require the necessary discord.js classes
const { Client, GatewayIntentBits, Collection } = require("discord.js");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildInvites,
  ],
});

//load the events files on startup
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

//load the command files on startup
client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute propert"`
    );
  }
}

client.on("messageCreate", (message) => {
  // Run the mention check for each message
  for (const cmd of client.commands.values()) {
    if (typeof cmd.checkMentions === "function") {
      cmd.checkMentions(message);
    }
  }
});

// Regular expression to match the phrase "how to tame koban" ignoring case and special characters
const kobanRegex = /how\s*to\s*tame\s*koban/i;

client.on("messageCreate", (message) => {
  if (kobanRegex.test(message.content)) {
    message.reply(
      "https://cdn.discordapp.com/attachments/1204181585994186832/1243640065301807265/1223554028794024018.png?ex=66523591&is=6650e411&hm=72134eca39e36ebe4e78712523ae120bde69ceb505ea5b5fd2105dd0d727c7a0&"
    );
  }
});

// Regular expression to match the phrase "smash clienterr" ignoring case and special characters
const clienterrregex = /smash\s*clienterr/i;

client.on("messageCreate", (message) => {
  if (clienterrregex.test(message.content)) {
    message.reply(":speaking_head::fire:");
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

mongoose
  .connect(database, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch((err) => {
    console.log(err);
  });

client.login(token);
