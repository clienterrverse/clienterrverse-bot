/** @format */

import { SlashCommandBuilder } from 'discord.js';
import User from "../../schemas/user.js";

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
      const userId = interaction.user.id;

      // Find the user in the database
      const user = await User.findOne({ id: userId });

      if (!user) {
        await interaction.reply({ content: "You are not registered yet.", ephemeral: true });
        return;
      }

      // Respond with the user's balance
      await interaction.reply({
        content: `Your balance: ${user.clienterrcoins} clienterr coins`,
        ephemeral: true
      });
    } catch (error) {
      console.error("An error occurred while fetching user balance:", error);
      await interaction.reply({ content: "An error occurred while fetching your balance.", ephemeral: true });
    }
  },
};
