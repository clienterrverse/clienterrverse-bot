/** @format */
// src\index.js
import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import errorHandler from "./utils/errorHandler.js";

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
    ],
  });
  errorHandler.errorHandler(client);
  await eventHandler(client);

  try {
    await client.login(process.env.TOKEN);
  } catch (error) {
    console.error("Error logging in:", error);
    process.exit(1);
  }
  // Schedule daily error summary report
  setInterval(() => {
    errorHandler.sendDailyErrorSummaryReport(errorHandler.errorCounts);
  }, 24 * 60 * 60 * 1000); // 24 hours in milliseconds
})();
