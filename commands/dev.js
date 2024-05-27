const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const profileModel = require("../models/profileSchema");

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
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("Make the bot leave a server by its ID")
        .addStringOption((option) =>
          option
            .setName("id")
            .setDescription("The ID of the server to leave")
            .setRequired(true)
        )
    )
    // Admin commands
    .addSubcommand((subcommand) =>
      subcommand
        .setName("addcoins")
        .setDescription("Add clienterr coins to a user's balance")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to add clienterr coins to")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of clienterr coins to add")
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("removecoins")
        .setDescription("Remove clienterr coins from a user's balance")
        .addUserOption((option) =>
          option
            .setName("user")
            .setDescription("The user you want to remove clienterr coins from")
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("The amount of clienterr coins to remove")
            .setRequired(true)
            .setMinValue(1)
        )
    ),
  async execute(interaction) {
    if (interaction.user.id !== DEVELOPER_ID) {
      return interaction.reply({
        content: "You ain't clienterr bro, you can't use this command!",
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

    if (devSubcommand === "leave") {
      const guildId = interaction.options.getString("id");
      const guild = interaction.client.guilds.cache.get(guildId);

      if (!guild) {
        return interaction.reply({
          content: `I am not a member of a server with ID: ${guildId}`,
          ephemeral: true,
        });
      }

      try {
        await guild.leave();
        return interaction.reply({
          content: `Successfully left the server: ${guild.name} (ID: ${guild.id})`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(
          `Failed to leave guild: ${guild.name} (ID: ${guild.id}) due to ${error}`
        );
        return interaction.reply({
          content: `Failed to leave the server: ${guild.name} (ID: ${guild.id}). Please try again later.`,
          ephemeral: true,
        });
      }
    }

    // Admin commands logic
    if (devSubcommand === "addcoins") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      try {
        const profile = await profileModel.findOneAndUpdate(
          { userId: user.id },
          { $inc: { ClienterrCoins: amount } },
          { new: true }
        );

        await interaction.reply({
          content: `Added ${amount} coins to ${user.username}'s balance. New balance: ${profile.ClienterrCoins}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error adding coins:", error);
        await interaction.reply({
          content: "Failed to add coins to the user's balance.",
          ephemeral: true,
        });
      }
    }

    if (devSubcommand === "removecoins") {
      const user = interaction.options.getUser("user");
      const amount = interaction.options.getInteger("amount");

      try {
        const profile = await profileModel.findOneAndUpdate(
          { userId: user.id },
          { $inc: { ClienterrCoins: -amount } },
          { new: true }
        );

        await interaction.reply({
          content: `Removed ${amount} coins from ${user.username}'s balance. New balance: ${profile.ClienterrCoins}`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Error removing coins:", error);
        await interaction.reply({
          content: "Failed to remove coins from the user's balance.",
          ephemeral: true,
        });
      }
    }
  },
};
