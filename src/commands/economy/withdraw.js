/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance, Transaction } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('withdraw')
    .setDescription('Withdraw a specified amount of clienterr coins from your bank account.')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The amount to withdraw')
        .setRequired(true)
    )
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
      const amount = interaction.options.getInteger('amount');

      if (amount <= 0) {
        return interaction.reply('Please enter a valid amount to withdraw.');
      }

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
        await userBalance.save();
      }

      // Check if the user has enough bank balance to withdraw
      if (userBalance.bank < amount) {
        return interaction.reply('You do not have enough bank balance to withdraw that amount.');
      }

      // Update the user's balance and bank amount
      userBalance.bank -= amount;
      userBalance.balance += amount;
      await userBalance.save();
      
      // Record the transaction
      const withdrawTransaction = new Transaction({
        userId: userId,
        type: 'withdraw',
        amount: amount,
      });
      await withdrawTransaction.save();

      // Create an embed to display the withdrawal information
      const embed = new EmbedBuilder()
        .setTitle('Withdrawal Successful')
        .setDescription(`You have withdrawn ${amount} clienterr coins from your bank.`)
        .setColor('#00FF00')
        .setFooter({
          text: `Withdrawal by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      // Send the embed as the reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing withdraw command:', error);
      await interaction.reply('There was an error trying to process your withdrawal.');
    }
  },
};
