/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('crime')
    .setDescription('Commit a crime and risk it all.'),
  userPermissions: [],
  botPermissions: [],
  cooldown: 3600, // 1 hour cooldown
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;

      // Fetch user's balance
      let userBalance = await Balance.findOne({ userId });
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      const crimeOutcome = Math.random() < 0.5; // 50% chance of success
      const amount = Math.floor(Math.random() * 30) + 1; // Random amount between 1 and 1000

      if (crimeOutcome) {
        userBalance.balance += amount;
        interaction.reply(`Success! You committed a crime and earned ${amount} coins. Your new balance is ${userBalance.balance} coins.`);
      } else {
        userBalance.balance -= amount;
        interaction.reply(`Failure! You got caught and lost ${amount} coins. Your new balance is ${userBalance.balance} coins.`);
      }

      await userBalance.save();
    } catch (error) {
      console.error('Error processing crime command:', error);
      interaction.reply('There was an error processing your crime.');
    }
  },
};
