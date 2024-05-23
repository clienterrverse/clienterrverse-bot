const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const developerId = "1215648186643906643"; // Replace with your actual developer ID

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Send a direct message to a member.")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("The member to DM")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setRequired(true)
    ),
  async execute(interaction) {
    // Check if the user is the developer
    if (interaction.user.id !== developerId) {
      return await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    const target = interaction.options.getUser("target");
    const message = interaction.options.getString("message");

    const member = interaction.guild.members.cache.get(target.id);

    if (!member) {
      return await interaction.reply({
        content: "Member not found in this server.",
        ephemeral: true,
      });
    }

    try {
      // Send the direct message to the target member
      await member.send(message);

      // Create an embed message for confirmation
      const embed = new EmbedBuilder()
        .setColor("#00ff00")
        .setTitle("Message Sent")
        .addFields(
          { name: "Member", value: `${target.tag}`, inline: true },
          { name: "Message", value: message, inline: false }
        )
        .setTimestamp();

      // Send an ephemeral reply to the developer
      await interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "There was an error trying to send the DM!",
        ephemeral: true,
      });
    }
  },
};
