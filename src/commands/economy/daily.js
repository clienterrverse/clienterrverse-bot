/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
   data: new SlashCommandBuilder()
      .setName('daily')
      .setDescription('Claim your daily reward.')
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
         const emoji = '🎁'; // Using a gift emoji for the daily reward
         const minAmount = 1; // Minimum amount to be received
         const maxAmount = 25; // Maximum amount to be received
         const dailyCooldown = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

         // Fetch the user's balance from the database
         let userBalance = await Balance.findOne({ userId });

         if (!userBalance) {
            userBalance = new Balance({ userId });
         }

         const now = Date.now();
         if (
            userBalance.lastDaily &&
            now - new Date(userBalance.lastDaily).getTime() < dailyCooldown
         ) {
            const timeLeft =
               dailyCooldown -
               (now - new Date(userBalance.lastDaily).getTime());
            const hours = Math.floor(timeLeft / (1000 * 60 * 60));
            const minutes = Math.floor(
               (timeLeft % (1000 * 60 * 60)) / (1000 * 60)
            );

            const embed = new EmbedBuilder()
               .setColor(0xff0000)
               .setTitle('Daily Reward')
               .setDescription(
                  `You have already claimed your daily reward. Please try again in ${hours} hours and ${minutes} minutes.`
               );

            return interaction.reply({ embeds: [embed], ephemeral: true });
         }

         // Generate a random amount for the daily reward
         const amount =
            Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

         // Update the user's balance and last daily claim time
         userBalance.balance += amount;
         userBalance.lastDaily = new Date();
         await userBalance.save();

         // Create an embed for the response
         const embed = new EmbedBuilder()
            .setColor(0x00ff00)
            .setTitle('Daily Reward')
            .setDescription(
               `${emoji} You have claimed your daily reward of ${amount} coins!`
            )
            .addFields({
               name: 'New Balance',
               value: `${userBalance.balance} coins`,
               inline: true,
            });

         // Reply with the embed
         await interaction.reply({ embeds: [embed] });
      } catch (error) {
         console.error('Error processing daily command:', error);
         const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle('Error')
            .setDescription(
               'There was an error trying to process your daily reward.'
            );

         await interaction.reply({ embeds: [embed], ephemeral: true });
      }
   },
};
