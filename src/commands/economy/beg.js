/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

// Ensure the MongoDB connection is established

export default {
  data: new SlashCommandBuilder()
    .setName("beg")
    .setDescription("Beg for some money.")
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 1000,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const emoji = '🙏'; // Using a praying hands emoji for begging
      const minAmount = 1; // Minimum amount to be received
      const maxAmount = 10; // Maximum amount to be received

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      // Generate a random amount for the beg
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance
      userBalance.balance += amount;
      await userBalance.save();

      // Reply with the amount received
      await interaction.reply(`${emoji} You begged and received ${amount} coins! Your new balance is ${userBalance.balance} coins.`);
    } catch (error) {
      console.error('Error processing beg command:', error);
      await interaction.reply('There was an error trying to process your beg request.');
    }
  },
};
