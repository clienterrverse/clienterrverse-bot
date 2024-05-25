require("dotenv").config;
const fs = require("node:fs");
const path = require("node:path");
const mongoose = require("mongoose");
const MessageCount = require("./models/messageCount");

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

// Listen for the "messageCreate" event to update message counts
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  try {
    const userId = message.author.id;
    const guildId = message.guild.id;

    // Find the user's message count in the database
    let messageCount = await MessageCount.findOne({ userId, guildId });

    // If the user doesn't exist, create a new entry
    if (!messageCount) {
      messageCount = await MessageCount.create({
        userId,
        guildId,
        messageCount: 1,
      });
    } else {
      // If the user exists, increment their message count by 1
      messageCount.messageCount++;
      await messageCount.save();
    }
  } catch (error) {
    console.error("Error updating message count:", error);
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
