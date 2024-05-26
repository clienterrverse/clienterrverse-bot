/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance ,Transaction} from '../../schemas/economy.js';


export default {
  data: new SlashCommandBuilder()
    .setName("deposit")
    .setDescription("Deposit a specified amount of your balance into your bank account.")
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('The amount to deposit')
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
        return interaction.reply('Please enter a valid amount to deposit.');
      }

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
        await userBalance.save();
      }

      // Check if the user has enough balance to deposit
      if (userBalance.balance < amount) {
        return interaction.reply('You do not have enough balance to deposit that amount.');
      }

      // Update the user's balance and bank amount
      userBalance.balance -= amount;
      userBalance.bank += amount;
      await userBalance.save();
      const depositTransaction = new Transaction({
        userId: userId,
        type: 'deposit', 
        amount: amount,
      })
      depositTransaction.save()


      // Create an embed to display the deposit information
      const embed = new EmbedBuilder()
        .setTitle('Deposit Successful')
        .setDescription(`You have deposited ${amount} coins into your bank.`)
        .setColor('#00FF00')
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      // Send the embed as the reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing deposit command:', error);
      await interaction.reply('There was an error trying to process your deposit.');
    }
  },
};
