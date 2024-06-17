/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('weekly')
    .setDescription('Claim your weekly reward.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, // Not used as we have a weekly cooldown
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const emoji = '🎁'; // Using a gift emoji for the weekly reward
      const minAmount = 20; // Minimum amount to be received
      const maxAmount = 60; // Maximum amount to be received
      const weeklyCooldown = 7 * 24 * 60 * 60 * 1000; // One week in milliseconds

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId, balance: 0, lastWeekly: null });
      }

      // Check if the user has already claimed their weekly reward
      const now = Date.now();
      const timeSinceLastWeekly = now - (userBalance.lastWeekly ? userBalance.lastWeekly.getTime() : 0);
      if (userBalance.lastWeekly && timeSinceLastWeekly < weeklyCooldown) {
        const timeLeft = weeklyCooldown - timeSinceLastWeekly;
        const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        return interaction.reply({ content: `You have already claimed your weekly reward. Please try again in ${days} days, ${hours} hours, and ${minutes} minutes.`, ephemeral: true });
      }

      // Generate a random amount for the weekly reward
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance and last weekly claim time
      userBalance.balance += amount;
      userBalance.lastWeekly = new Date();
      await userBalance.save();

      // Reply with the amount received
      await interaction.reply({ content: `${emoji} You have claimed your weekly reward of ${amount} coins! Your new balance is ${userBalance.balance} coins.`, ephemeral: true });
    } catch (error) {
      console.error('Error processing weekly command:', error);
      await interaction.reply({ content: 'There was an error trying to process your weekly reward. Please try again later.', ephemeral: true });
    }
  },
};
