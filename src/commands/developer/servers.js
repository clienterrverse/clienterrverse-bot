import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

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
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === "list") {
      try {
        // Defer the reply to give the bot time to fetch the data
        await interaction.deferReply();

        // Fetch the guilds the bot is in
        const guilds = await Promise.all(
          client.guilds.cache.map(async (guild) => {
            let inviteLink = "No invite link available";
            try {
              const invite = await guild.systemChannel.createInvite({
                maxAge: 0, // Permanent invite
                maxUses: 0, // Unlimited uses
              });
              inviteLink = invite.url;
            } catch (error) {
              console.error(
                `Could not create invite for guild ${guild.id}:`,
                error
              );
            }
            return {
              name: guild.name,
              memberCount: guild.memberCount,
              id: guild.id,
              inviteLink,
            };
          })
        );

        // Check if there are any guilds
        if (guilds.length === 0) {
          return await interaction.editReply("The bot is not in any servers.");
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
        guilds.forEach((guild) => {
          if (fieldCount >= MAX_FIELDS) {
            fieldCount = 0;
            interaction.followUp({ embeds: [embed] });
            embed.setFields([]);
          }
          embed.addFields({
            name: guild.name,
            value: `ID: ${guild.id}\nMembers: ${guild.memberCount}\n[Invite Link](${guild.inviteLink})`,
            inline: true,
          });
          fieldCount++;
        });

        // Send the final embed
        await interaction.editReply({ embeds: [embed] });
      } catch (error) {
        console.error(
          "Error fetching servers or creating invite links:",
          error
        );
        await interaction.editReply(
          "There was an error trying to fetch the server list or create invite links."
        );
      }
    } else if (subcommand === "leave") {
      const serverId = interaction.options.getString("server-id");

      try {
        // Fetch the guild by ID
        const guild = client.guilds.cache.get(serverId);

        // If the guild is not found, send an error message
        if (!guild) {
          return await interaction.reply({
            content: `I am not in a server with the ID ${serverId}.`,
            ephemeral: true,
          });
        }

        // Leave the guild
        await guild.leave();

        // Reply to the interaction
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
    }
  },
};
