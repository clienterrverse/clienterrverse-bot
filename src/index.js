/** @format */

import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

// Check for the presence of the TOKEN environment variable
if (!process.env.TOKEN) {
  console.error("TOKEN is not defined in the environment variables");
  process.exit(1);
}

// Main function to set up and start the Discord client
(async () => {
  // Import the event handler dynamically
  const { default: eventHandler } = await import("./handlers/eventHandler.js");

  // Create a new Discord client with the necessary intents
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
    ],
  });

  // Handle events using the imported event handler
  eventHandler(client);

  try {
    // Attempt to log in to Discord with the provided token
    await client.login(process.env.TOKEN);
    console.log("Successfully logged in to Discord");
  } catch (error) {
    // Log and handle any errors that occur during login
    console.error("Error logging in:", error);
    process.exit(1);
  }
})();
