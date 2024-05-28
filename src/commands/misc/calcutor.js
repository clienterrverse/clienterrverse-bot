import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("calculator")
    .setDescription("Need help with some math?")
    .toJSON(),
  deleted: false,

  run: async (client, interaction) => {
    await interaction.reply("This command is currently disabled.");
  },
};
