/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check your balance.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: false,
  dmAllowed: true,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
        await userBalance.save();
      }

      // Create an embed to display the user's balance
      const balanceEmbed = new EmbedBuilder()
        .setColor('#00FF00') // Green color for positive information
        .setTitle('Balance Information')
        .setDescription(`Here is your current balance information:`)
        .addFields(
          { name: 'Wallet Balance', value: `${userBalance.balance} clienterr coins`, inline: true },
          { name: 'Bank Balance', value: `${userBalance.bank} clienterr coins`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Reply with the embed containing the user's balance
      await interaction.reply({ embeds: [balanceEmbed] });
    } catch (error) {
      console.error('Error fetching balance:', error);
      await interaction.reply('There was an error trying to fetch your balance.');
    }
  },
};
