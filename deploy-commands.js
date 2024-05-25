require("dotenv").config();
const { REST, Routes } = require("discord.js");
const {
  CLIENT_ID: clientId,
  GUILD_ID: guildId,
  DISCORD_TOKEN: token,
} = process.env;
const fs = require("node:fs");

console.log(token);

const commands = [];
// Grab all the command files from the commands directory you created earlier
const commandFiles = fs
  .readdirSync("./commands")
  .filter((file) => file.endsWith(".js"));

// Grab the SlashCommandBuilder#toJSON() output of each command's data for deployment
for (const file of commandFiles) {
  try {
    const command = require(`./commands/${file}`);
    if (command.data) {
      commands.push(command.data.toJSON());
    } else {
      console.warn(`Command file ${file} is missing the "data" property.`);
    }
  } catch (error) {
    console.error(`Error loading command file ${file}:`, error);
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST({ version: "10" }).setToken(token);

// and deploy your commands!
(async () => {
  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();
