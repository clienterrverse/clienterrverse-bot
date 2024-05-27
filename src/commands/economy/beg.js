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
  cooldown: 1000, // Adjust the cooldown as necessary
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const emoji = '🙏'; // Using a praying hands emoji for begging
      const minAmount = 1; // Minimum amount to be received
      const maxAmount = 10; // Maximum amount to be received

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
      }

      // Generate a random amount for the beg
      const amount = Math.floor(Math.random() * (maxAmount - minAmount + 1)) + minAmount;

      // Update the user's balance
      userBalance.balance += amount;
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
      await interaction.reply('There was an error trying to process your beg request.');
    }
  },
};
