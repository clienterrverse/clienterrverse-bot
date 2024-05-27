/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

// Ensure the MongoDB connection is established

export default {
  data: new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Claim your daily reward.")
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
      const emoji = '🎁'; // Using a gift emoji for the daily reward
      const minAmount = 1; // Minimum amount to be received
      const maxAmount = 20; // Maximum amount to be received
      const dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      // Check if the user has already claimed their daily reward
      const now = Date.now();
      if (userBalance.lastDaily && (now - userBalance.lastDaily.getTime()) < dailyCooldown) {
        const timeLeft = dailyCooldown - (now - userBalance.lastDaily.getTime());
        const hours = Math.floor(timeLeft / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return interaction.reply(`You have already claimed your daily reward. Please try again in ${hours} hours and ${minutes} minutes.`);
      }

      // Generate a random amount for the daily reward
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance and last daily claim time
      userBalance.balance += amount;
      userBalance.lastDaily = new Date();
      await userBalance.save();

      // Reply with the amount received
      await interaction.reply(`${emoji} You have claimed your daily reward of ${amount} coins! Your new balance is ${userBalance.balance} coins.`);
    } catch (error) {
      console.error('Error processing daily command:', error);
      await interaction.reply('There was an error trying to process your daily reward.');
    }
  },
};
