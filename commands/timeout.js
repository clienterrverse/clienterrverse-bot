const {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a member for a specified duration.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to timeout")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("The duration of the timeout (e.g., 1m, 2h, 3d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the timeout")
        .setRequired(false)
    ),
  async execute(interaction) {
    const target = interaction.options.getUser("target");
    const durationString = interaction.options.getString("duration");
    const reason =
      interaction.options.getString("reason") || "No reason provided";

    // Check if the user has permission to moderate members
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.ModerateMembers
      )
    ) {
      return await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return await interaction.reply({
        content: "Member not found in this server.",
        ephemeral: true,
      });
    }

    // Function to parse duration string to milliseconds
    const parseDuration = (duration) => {
      const timeValue = parseInt(duration.slice(0, -1));
      const timeUnit = duration.slice(-1);
      let milliseconds = 0;

      if (isNaN(timeValue)) {
        return null;
      }

      switch (timeUnit) {
        case "m":
          milliseconds = timeValue * 60 * 1000; // minutes to milliseconds
          break;
        case "h":
          milliseconds = timeValue * 60 * 60 * 1000; // hours to milliseconds
          break;
        case "d":
          milliseconds = timeValue * 24 * 60 * 60 * 1000; // days to milliseconds
          break;
        default:
          return null;
      }

      return milliseconds;
    };

    const duration = parseDuration(durationString);

    if (!duration || duration <= 0) {
      return await interaction.reply({
        content: "Please enter a valid duration (e.g., 1m, 2h, 3d).",
        ephemeral: true,
      });
    }

    try {
      // Timeout the member
      await member.timeout(duration, reason);

      // Create an embed message
      const embed = new EmbedBuilder()
        .setColor("#ff0000")
        .setTitle("Member Timed Out")
        .addFields(
          { name: "Member", value: `${target.tag}`, inline: true },
          { name: "Duration", value: `${durationString}`, inline: true },
          { name: "Reason", value: reason, inline: false },
          { name: "Moderator", value: `${interaction.user.tag}`, inline: true }
        )
        .setTimestamp();

      // Send an ephemeral reply
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error trying to timeout this member!",
        ephemeral: true,
      });
    }
  },
};
