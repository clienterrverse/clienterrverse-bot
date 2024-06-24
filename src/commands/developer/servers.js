/** @format */

import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import paginateEmbeds from "../../utils/buttonPagination.js"; // Correct import statement

export default {
  data: new SlashCommandBuilder()
    .setName("servers")
    .setDescription(
      "List servers the bot is in and provide invite links or make the bot leave a server."
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("list")
        .setDescription("List servers the bot is in and provide invite links")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("leave")
        .setDescription("Make the bot leave a specified server by its ID.")
        .addStringOption((option) =>
          option
            .setName("server-id")
            .setDescription("The ID of the server the bot should leave.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("check")
        .setDescription("Check if the bot is in specified servers by their IDs.")
        .addStringOption((option) =>
          option
            .setName("server-ids")
            .setDescription("Comma-separated IDs of the servers to check.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("user")
        .setDescription("Show the number of servers a user owns.")
        .addStringOption((option) =>
          option
            .setName("user-id")
            .setDescription("The ID of the user to check.")
            .setRequired(true)
        )
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      try {
        const guilds = await Promise.all(
          client.guilds.cache.map(async (guild) => {
            let inviteLink = "No invite link available";
            try {
              if (guild.systemChannel) {
                const invite = await guild.systemChannel.createInvite({ maxAge: 0, maxUses: 0 });
                inviteLink = invite.url;
              }
            } catch (error) {
              console.error(`Could not create invite for guild ${guild.id}:`, error);
            }
            return {
              name: guild.name,
              memberCount: guild.memberCount,
              id: guild.id,
              inviteLink,
            };
          })
        );

        if (guilds.length === 0) {
          return await interaction.editReply("The bot is not in any servers.");
        }

        const embeds = [];
        const MAX_FIELDS = 8;

        for (let i = 0; i < guilds.length; i += MAX_FIELDS) {
          const currentGuilds = guilds.slice(i, i + MAX_FIELDS);
          const embed = new EmbedBuilder()
            .setTitle("Servers List")
            .setDescription(`The bot is in **${guilds.length}** servers.`)
            .setColor("#00FF00")
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({
              text: `Requested by ${interaction.user.username}`,
              iconURL: interaction.user.displayAvatarURL({ format: "png", dynamic: true, size: 1024 }),
            });

          currentGuilds.forEach((guild) => {
            embed.addFields({
              name: guild.name,
              value: `ID: ${guild.id}\nMembers: ${guild.memberCount}\n[Invite Link](${guild.inviteLink})`,
              inline: true,
            });
          });

          embeds.push(embed);
        }

        await paginateEmbeds(interaction, embeds);
      } catch (error) {
        console.error("Error fetching servers or creating invite links:", error);
        await interaction.editReply("There was an error trying to fetch the server list or create invite links.");
      }
    } else if (subcommand === "leave") {
      const serverId = interaction.options.getString("server-id");

      try {
        const guild = client.guilds.cache.get(serverId);

        if (!guild) {
          return await interaction.reply({
            content: `I am not in a server with the ID ${serverId}.`,
            ephemeral: true,
          });
        }

        await guild.leave();

        await interaction.reply({
          content: `I have left the server **${guild.name}** (ID: ${serverId}).`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(`Error leaving guild ${serverId}:`, error);
        await interaction.reply({
          content: `There was an error trying to leave the server with ID ${serverId}.`,
          ephemeral: true,
        });
      }
    } else if (subcommand === "check") {
      const serverIds = interaction.options.getString("server-ids").split(",").map(id => id.trim());

      const results = serverIds.map(serverId => {
        const guild = client.guilds.cache.get(serverId);
        return guild
          ? `The bot is in the server **${guild.name}** (ID: ${serverId}).`
          : `The bot is not in a server with the ID ${serverId}.`;
      }).join("\n");

      await interaction.reply({
        content: results,
        ephemeral: true,
      });
    } else if (subcommand === "user") {
      const userId = interaction.options.getString("user-id");

      const userServers = client.guilds.cache.filter(guild => guild.ownerId === userId);
      const serverCount = userServers.size;

      await interaction.reply({
        content: `User with ID ${userId} owns **${serverCount}** server(s) that the bot is in.`,
      });
    }
  },
};
