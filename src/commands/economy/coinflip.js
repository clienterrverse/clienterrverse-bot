/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('coinflip')
      .setDescription(
         'Gamble a specified amount of clienterr coins by flipping a virtual clienterr coin.'
      )
      .addStringOption((option) =>
         option
            .setName('roll_result')
            .setDescription('Your choice: "heads" or "tails".')
            .setRequired(true)
            .addChoices(
               { name: 'Heads', value: 'heads' },
               { name: 'Tails', value: 'tails' }
            )
      )
      .addIntegerOption((option) =>
         option
            .setName('gamble_amount')
            .setDescription('The amount of clienterr coins you want to gamble.')
            .setMinValue(1)
            .setMaxValue(30)
            .setRequired(true)
      )
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 10,
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'economy',

   run: async (client, interaction) => {
      const userId = interaction.user.id;
      const rollResult = interaction.options.getString('roll_result');
      const gambleAmount = interaction.options.getInteger('gamble_amount');
      const hourlyCooldown = 10 * 60 * 1000; // 1 hour in milliseconds

      if (gambleAmount < 1 || gambleAmount > 25) {
         const embed = new EmbedBuilder().setDescription(
            'The bet amount must be between 1 and 25 clienterr coins.'
         );
         return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
         userBalance = new Balance({ userId });
      }

      const now = Date.now();
      if (
         userBalance.lastcoin &&
         now - userBalance.lastcoin.getTime() < hourlyCooldown
      ) {
         const timeLeft =
            hourlyCooldown - (now - userBalance.lastcoin.getTime());
         const minutes = Math.floor(timeLeft / (1000 * 60));
         const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
         return interaction.reply(
            `You have already flipped a coin in this hour. Please try again in ${minutes} minutes and ${seconds} seconds.`
         );
      }

      // Check if the user has enough balance to gamble
      if (userBalance.balance < gambleAmount) {
         const embed = new EmbedBuilder()
            .setDescription(
               'You do not have enough balance to gamble that amount.'
            )
            .setColor(mconfig.embedColorError);

         return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Generate a random result (heads or tails)
      const coinResult = Math.random() < 0.5 ? 'heads' : 'tails';

      // Determine the outcome of the clienterr coinflip
      let outcome;
      let color;
      if (rollResult === coinResult) {
         userBalance.balance += gambleAmount;
         outcome = `You won ${gambleAmount} clienterr coins!`;
         color = mconfig.embedColorSuccess;
      } else {
         userBalance.balance -= gambleAmount;
         outcome = `You lost ${gambleAmount} clienterr coins.`;
         color = mconfig.embedColorError;
      }

      // Save the updated balance and last coin flip time to the database
      userBalance.lastcoin = new Date();
      await userBalance.save();

      const embed = new EmbedBuilder()
         .setDescription(
            `${outcome} The clienterr coin landed on ${coinResult}. Your new balance is ${userBalance.balance} clienterr coins.`
         )
         .setColor(color);

      // Reply with the outcome of the clienterr coinflip
      await interaction.reply({ embeds: [embed] });
   },
};
