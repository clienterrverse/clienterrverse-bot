export default async (client, guildId) => {
  // fetched commands
  let commandCache = {};

  //  fetch commands
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
    //  cache first
    if (commandCache[guildId || 'global']) {
      return commandCache[guildId || 'global'];
    }

    let applicationCommands;

    try {
      if (guildId) {
        //  guild-specific commands
        const guild = await client.guilds.fetch(guildId);
        applicationCommands = guild.commands;
      } else {
        //  global commands
        applicationCommands = client.application.commands;
      }

      //  cache commands
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
