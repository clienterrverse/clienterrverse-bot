/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('Gamble a specified amount of coins by flipping a virtual coin.')
    .addStringOption(option => 
      option.setName('roll_result')
        .setDescription('Your choice: "heads" or "tails".')
        .setRequired(true)
        .addChoices(
          { name: 'Heads', value: 'heads' },
          { name: 'Tails', value: 'tails' }
        )
    )
    .addIntegerOption(option => 
      option.setName('gamble_amount')
        .setDescription('The amount of coins you want to gamble.')
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const rollResult = interaction.options.getString('roll_result');
      const gambleAmount = interaction.options.getInteger('gamble_amount');

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      // Check if the user has enough balance to gamble
      if (userBalance.balance < gambleAmount) {
        return interaction.reply('You do not have enough balance to gamble that amount.');
      }

      // Generate a random result (heads or tails)
      const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';

      // Determine the outcome of the coinflip
      let outcome;
      if (rollResult === coinResult) {
        userBalance.balance += gambleAmount;
        outcome = 'You won!';
      } else {
        userBalance.balance -= gambleAmount;
        outcome = 'You lost.';
      }

      // Save the updated balance to the database
      await userBalance.save();

      // Reply with the outcome of the coinflip
      await interaction.reply(`${outcome} The coin landed on ${coinResult}. Your new balance is ${userBalance.balance} coins.`);
    } catch (error) {
      console.error('Error processing coinflip command:', error);
      await interaction.reply('There was an error trying to process your coinflip.');
    }
  },
};
