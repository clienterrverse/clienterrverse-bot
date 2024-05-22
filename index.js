require("dotenv").config();

const fs = require("fs");
const path = require("path");

const { DISCORD_TOKEN: token } = process.env;

const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: "There was an error executing this command!",
      ephemeral: true,
    });
  }
});

let pingBlockingEnabled = false; // Initialize ping blocking state

client.on("messageCreate", (message) => {
  if (message.author.bot || !message.guild) return;

  if (pingBlockingEnabled && message.mentions.users.size > 0) {
    message.delete().catch(console.error);
    message
      .reply("Pinging is currently blocked.")
      .then((msg) => msg.delete({ timeout: 5000 }))
      .catch(console.error);
  }
});

client.login(token);
