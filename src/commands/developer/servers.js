import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription("List server of bot")
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    try {
      // Defer the reply to give the bot time to fetch the data
      await interaction.deferReply();

      // Fetch the guilds the bot is in
      const guilds = client.guilds.cache.map(guild => ({
        name: guild.name,
        memberCount: guild.memberCount,
        id: guild.id
      }));

      // Check if there are any guilds
      if (guilds.length === 0) {
        return await interaction.editReply('The bot is not in any servers.');
      }

      // Create an embed to display the server information
      const embed = new EmbedBuilder()
        .setTitle("Servers List")
        .setDescription(`The bot is in **${guilds.length}** servers.`)
        .setColor("#00FF00")
        .setThumbnail(client.user.displayAvatarURL())
        .setFooter({
          text: `Requested by ${interaction.user.username}`, // Set the footer text as the username of the requester
          iconURL: interaction.user.displayAvatarURL({
            format: "png",
            dynamic: true,
            size: 1024,
          }), // Set the footer icon as the requester's avatar
        });

      // Add fields to the embed in batches to avoid exceeding Discord's limits
      const MAX_FIELDS = 25; // Discord's limit is 25 fields per embed
      let fieldCount = 0;
      guilds.forEach(guild => {
        if (fieldCount >= MAX_FIELDS) {
          fieldCount = 0;
          interaction.followUp({ embeds: [embed] });
          embed.setFields([]);
        }
        embed.addFields({
          name: guild.name,
          value: `ID: ${guild.id}\nMembers: ${guild.memberCount}`,
          inline: true
        });
        fieldCount++;
      });

      // Send the final embed
      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error fetching servers:', error);
      await interaction.editReply('There was an error trying to fetch the server list.');
    }
  }
};
