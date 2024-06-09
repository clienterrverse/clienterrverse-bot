import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName("role")
    .setDescription("Add or remove a role from yourself.")
    .addStringOption(option =>
      option.setName("action")
        .setDescription("Specify the action")
        .setRequired(true)
        .addChoice("Add", "add")
        .addChoice("Remove", "remove")
    )
    .addRoleOption(option =>
      option.setName("role")
        .setDescription("Select a role")
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: ["MANAGE_ROLES"],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    const action = interaction.options.getString("action");
    const role = interaction.options.getRole("role");

    if (action === "add") {
      try {
        await interaction.member.roles.add(role);
        await interaction.reply(`Successfully added the ${role.name} role to you.`);
      } catch (error) {
        console.error("Failed to add role:", error);
        await interaction.reply("Failed to add the role. Please check bot permissions.");
      }
    } else if (action === "remove") {
      try {
        await interaction.member.roles.remove(role);
        await interaction.reply(`Successfully removed the ${role.name} role from you.`);
      } catch (error) {
        console.error("Failed to remove role:", error);
        await interaction.reply("Failed to remove the role. Please check bot permissions.");
      }
    }
  },
};
