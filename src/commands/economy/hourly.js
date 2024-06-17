import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName("hourly")
    .setDescription("Claim your hourly reward.")
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 500,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const emoji = '⏳'; // Using an hourglass emoji for the hourly reward
      const minAmount = 1; // Minimum amount to be received
      const maxAmount = 7; // Maximum amount to be received
      const hourlyCooldown = 60 * 60 * 1000; // 1 hour in milliseconds

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      // Check if the user has already claimed their hourly reward
      const now = Date.now();
      if (userBalance.lastHourly && (now - userBalance.lastHourly.getTime()) < hourlyCooldown) {
        const timeLeft = hourlyCooldown - (now - userBalance.lastHourly.getTime());
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        return interaction.reply(`You have already claimed your hourly reward. Please try again in ${minutes} minutes and ${seconds} seconds.`);
      }

      // Generate a random amount for the hourly reward
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance and last hourly claim time
      userBalance.balance += amount;
      userBalance.lastHourly = new Date();
      await userBalance.save();

      // Create an embed to display the reward information
      const embed = new EmbedBuilder()
        .setTitle('Hourly Reward')
        .setDescription(`${emoji} You have claimed your hourly reward of ${amount} clienterr coins!`)
        .setColor('#00FF00')
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      // Send the embed as the reply
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing hourly command:', error);
      const errorEmbed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error trying to process your hourly reward.')
        .setColor('#FF0000')
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
