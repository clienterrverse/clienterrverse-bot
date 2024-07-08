/**
 * Fetches and caches the commands for a given client and guild ID.
 * @param {Client} client - The Discord client instance.
 * @param {string} [guildId] - The guild ID to fetch commands for. If not provided, fetches global commands.
 * @returns {Promise<Array>} The fetched commands.
 */

export default async (client, guildId) => {
   let applicationCommands;
   if (guildId) {
      const guild = await client.guilds.fetch(guildId);
      applicationCommands = guild.commands;
   } else {
      applicationCommands = await client.application.commands;
   }

   await applicationCommands.fetch();
   return applicationCommands;
};
