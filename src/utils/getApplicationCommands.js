export default async (client, guildId) => {
  // Cache for fetched commands
  let commandCache = {};

  // Function to fetch commands
  const fetchCommands = async (commands) => {
    try {
      await commands.fetch();
      return commands;
    } catch (error) {
      console.error('Error fetching commands:', error);
      return null;
    }
  };

  // Main function to get commands with caching and error handling
  const getCommands = async (client, guildId) => {
    // Check cache first
    if (commandCache[guildId || 'global']) {
      return commandCache[guildId || 'global'];
    }

    let applicationCommands;

    try {
      if (guildId) {
        // Fetch guild-specific commands
        const guild = await client.guilds.fetch(guildId);
        applicationCommands = guild.commands;
      } else {
        // Fetch global commands
        applicationCommands = client.application.commands;
      }

      // Fetch and cache commands
      const commands = await fetchCommands(applicationCommands);
      if (commands) {
        commandCache[guildId || 'global'] = commands;
      }

      return commands;
    } catch (error) {
      console.error('Error getting commands:', error);
      return null;
    }
  };

  return getCommands(client, guildId);
};
