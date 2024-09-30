/**
 * Fetches and caches the application commands for a given client and guild ID.
 * This function dynamically determines whether to fetch guild-specific or global commands based on the presence of a guild ID.
 *
 * @param {Client} client - The Discord client instance, which is used to interact with the Discord API.
 * @param {string} [guildId] - The guild ID to fetch commands for. If not provided, the function fetches global commands.
 * @returns {Promise<Array>} A promise that resolves to an array of fetched application commands.
 */

export default async (client, guildId) => {
  let applicationCommands;
  // Determine whether to fetch guild-specific or global commands
  if (guildId) {
    // Fetch the guild instance for the given guild ID
    const guild = await client.guilds.fetch(guildId);
    // Get the commands manager for the guild
    applicationCommands = guild.commands;
  } else {
    // Fetch the global commands for the client's application
    applicationCommands = await client.application.commands;
  }

  // Fetch the commands from the API and cache them
  await applicationCommands.fetch();
  // Return the fetched and cached commands
  return applicationCommands;
};
