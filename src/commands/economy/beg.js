/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('beg')
    .setDescription('Beg for some money.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 10, // Adjust the cooldown as necessary
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const emoji = '🙏'; // Using a praying hands emoji for begging
      const minAmount = 1; // Minimum amount to be received
      const maxAmount = 10; // Maximum amount to be received
      const hourlyCooldown = 60 * 60 * 1000; // 1 hour in milliseconds

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      const now = Date.now();
      if (userBalance.lastBeg && (now - userBalance.lastBeg.getTime()) < hourlyCooldown) {
        const timeLeft = hourlyCooldown - (now - userBalance.lastBeg.getTime());
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        return interaction.reply(`You have already begged in this hour. Please try again in ${minutes} minutes and ${seconds} seconds.`);
      }

      // Generate a random amount for the beg
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance and last beg time
      userBalance.balance += amount;
      userBalance.lastBeg = new Date();
      await userBalance.save();

      // Create an embed to display the result of the beg command
      const begEmbed = new EmbedBuilder()
        .setColor('#00FF00') // Green color to indicate success
        .setTitle('Begging Results')
        .setDescription(`${emoji} You begged and received ${amount} clienterr coins!`)
        .addFields(
          { name: 'New Balance', value: `${userBalance.balance} clienterr coins`, inline: true }
        )
        .setFooter({ text: `Beg by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Reply with the embed
      await interaction.reply({ embeds: [begEmbed] });
    } catch (error) {
      console.error('Error processing beg command:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000') // Red color to indicate error
        .setDescription('There was an error trying to process your beg request.');
      await interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
