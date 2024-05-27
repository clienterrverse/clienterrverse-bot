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
        await interaction.deferReply();

        const guilds = await Promise.all(
          client.guilds.cache.map(async (guild) => {
            let inviteLink = "No invite link available";
            try {
              const invite = await guild.systemChannel.createInvite({
                maxAge: 0,
                maxUses: 0,
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

        if (guilds.length === 0) {
          return await interaction.editReply("The bot is not in any servers.");
        }

        const embed = new EmbedBuilder()
          .setTitle("Servers List")
          .setDescription(`The bot is in **${guilds.length}** servers.`)
          .setColor("#00FF00")
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({
            text: `Requested by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({
              format: "png",
              dynamic: true,
              size: 1024,
            }),
          });

        const MAX_FIELDS = 25;
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
    }
  },
};
