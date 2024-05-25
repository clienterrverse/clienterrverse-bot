const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const DEVELOPER_ID = "1215648186643906643"; // Replace with the developer's Discord ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dev")
    .setDescription("Developer only commands")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("dm")
        .setDescription("Send a direct message to a user")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to send a DM to")
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName("message")
            .setDescription("The message to send")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("servers")
        .setDescription(
          "List all servers the bot is in with their invite links"
        )
    ),
  async execute(interaction) {
    if (interaction.user.id !== DEVELOPER_ID) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const devSubcommand = interaction.options.getSubcommand();

    if (devSubcommand === "dm") {
      const user = interaction.options.getUser("user");
      const message = interaction.options.getString("message");

      try {
        await user.send(message);
        await interaction.reply(`Message sent to ${user.username}.`);
      } catch (error) {
        console.error(error);
        await interaction.reply("Failed to send the message.");
      }
    }

    if (devSubcommand === "servers") {
      const client = interaction.client;

      try {
        const serverList = await Promise.all(
          client.guilds.cache.map(async (guild) => {
            let invite = "No invite available";
            try {
              const invites = await guild.invites.fetch();
              if (invites.size > 0) {
                invite = invites.first().url;
              } else {
                const channels = guild.channels.cache.filter((channel) =>
                  channel.isTextBased()
                );
                if (channels.size > 0) {
                  const inviteChannel = channels.first();
                  const inviteObject = await inviteChannel.createInvite({
                    maxAge: 0,
                    maxUses: 0,
                  });
                  invite = inviteObject.url;
                }
              }
            } catch (err) {
              console.error(
                `Failed to fetch or create invite for guild: ${guild.name}`,
                err
              );
            }
            return {
              name: guild.name,
              invite: invite,
            };
          })
        );

        const embed = new EmbedBuilder()
          .setTitle("Server List")
          .setDescription(
            "Here are all the servers the bot is in along with their invite links:"
          )
          .setColor(0x00ae86)
          .setTimestamp();

        serverList.forEach((server) => {
          embed.addFields({
            name: server.name,
            value: server.invite,
            inline: false,
          });
        });

        await interaction.reply({ embeds: [embed] });
      } catch (error) {
        console.error(error);
        await interaction.reply("Failed to retrieve server list.");
      }
    }
  },
};
