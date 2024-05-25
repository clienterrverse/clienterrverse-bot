/** @format */

import { SlashCommandBuilder } from 'discord.js';
import profileModel from "../../schemas/profileSchema.js";

export default {
  data: new SlashCommandBuilder()
    .setName("balance")
    .setDescription("Shows a user their balance")
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const profileData = await profileModel.findOne({ userId: interaction.user.id });

      const { ClienterrCoins } = profileData;
      const username = interaction.user.username;

      await interaction.reply({
        content: `${username} has ${ClienterrCoins} clienterr coins.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error("An error occurred while fetching profile data:", error);
      await interaction.reply({
        content: "An error occurred while fetching your balance. Please try again later.",
        ephemeral: true,
      });
    }
  },
};
