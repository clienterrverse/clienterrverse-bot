/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
   data: new SlashCommandBuilder()
      .setName('slots')
      .setDescription('Play the slot machine.')
      .addNumberOption((option) =>
         option
            .setName('bet')
            .setDescription('Amount to bet (max 10)')
            .setRequired(true)
            .setMaxValue(10)
      )
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 10, // 10 seconds cooldown
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'economy',
   prefix: true,

   run: async (client, interaction) => {
      const userId = interaction.user.id;
      const betAmount = interaction.options.getNumber('bet');
      const slotCooldown = 5 * 60 * 1000; // 5 minutes in milliseconds

      // Validate bet amount
      if (betAmount <= 0) {
         const embed = new EmbedBuilder().setDescription(
            'The bet amount cannot be negative.'
         );
         return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      if (betAmount > 10) {
         const embed = new EmbedBuilder().setDescription(
            'The maximum bet amount is 10 coins.'
         );
         return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check user's balance
      const userBalance = await Balance.findOne({ userId });
      if (!userBalance || userBalance.balance < betAmount) {
         const embed = new EmbedBuilder().setDescription(
            'You do not have enough coins to place this bet.'
         );
         return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Check slot cooldown
      const now = Date.now();
      if (
         userBalance.lastSlots &&
         now - userBalance.lastSlots.getTime() < slotCooldown
      ) {
         const timeLeft =
            slotCooldown - (now - userBalance.lastSlots.getTime());
         const minutes = Math.floor(timeLeft / (1000 * 60));
         const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
         const embed = new EmbedBuilder().setDescription(
            `You need to wait ${minutes} minutes and ${seconds} seconds before using this command again.`
         );
         return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      // Play the slots
      const slots = ['🍒', '🍋', '🍉', '🍇', '🍓'];
      const result = [
         slots[Math.floor(Math.random() * slots.length)],
         slots[Math.floor(Math.random() * slots.length)],
         slots[Math.floor(Math.random() * slots.length)],
      ];
      const win = result[0] === result[1] && result[1] === result[2];

      // Update user's balance and last slots claim time
      userBalance.balance += win ? betAmount * 5 : -betAmount; // 5x payout on win
      userBalance.lastSlots = new Date();
      await userBalance.save();

      // Send the result
      const responseEmbed = new EmbedBuilder().setDescription(
         `🎰 | ${result.join(' ')} | You ${win ? 'won' : 'lost'} ${win ? betAmount * 5 : betAmount} coins! Your new balance is ${userBalance.balance} coins.`
      );
      await interaction.reply({ embeds: [responseEmbed] });
   },
};
