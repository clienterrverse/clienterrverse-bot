const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

const noPingAdmins = new Set();
const warningCooldowns = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName("disableping")
    .setDescription("Enable or disable the no-ping feature for administrators.")
    .addStringOption((option) =>
      option
        .setName("action")
        .setDescription("Choose enable or disable")
        .setRequired(true)
        .addChoices(
          { name: "enable", value: "enable" },
          { name: "disable", value: "disable" }
        )
    ),
  async execute(interaction) {
    if (
      !interaction.member.permissions.has(PermissionsBitField.ADMINISTRATOR)
    ) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const action = interaction.options.getString("action");

    if (action === "enable") {
      noPingAdmins.add(interaction.user.id);
      await interaction.reply({
        content:
          "No-ping feature enabled. Users will not be able to mention you.",
        ephemeral: true,
      });
    } else if (action === "disable") {
      noPingAdmins.delete(interaction.user.id);
      await interaction.reply({
        content: "No-ping feature disabled. Users can mention you now.",
        ephemeral: true,
      });
    }
  },

  async checkMentions(message) {
    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(async (user) => {
        if (noPingAdmins.has(user.id)) {
          const now = Date.now();
          const userCooldown = warningCooldowns.get(user.id);

          // Check if the user is on cooldown
          if (!userCooldown || now - userCooldown > 10000) {
            try {
              // Delete the original message (the ping)
              await message.delete();

              // Attempt to send a warning message as a direct message to the author of the message
              await message.author.send(
                `Please avoid mentioning admins in server: ${message.guild.name}.`
              );

              // Set cooldown for the user
              warningCooldowns.set(user.id, now);
            } catch (error) {
              // Handle the case where the author has disabled direct messages
              console.error(
                `Error sending warning message to ${message.author.username}: ${error.message}`
              );

              // Notify the server chat that the author has disabled direct messages
              await message.channel.send(
                `Unable to send a warning message to ${message.author.username} because they have direct messages disabled.`
              );
            }
          }
        }
      });
    }
  },
};
