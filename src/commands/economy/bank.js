/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bank')
    .setDescription('Your bank balance.')
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

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });

      // If the user does not exist in the database, create a new entry
      if (!userBalance) {
        userBalance = new Balance({ userId });
        await userBalance.save();
      }

      // Create an embed to display the user's bank balance
      const bankEmbed = new EmbedBuilder()
        .setColor('#0000FF') // Blue color for bank information
        .setTitle('Bank Balance Information')
        .setDescription(`Here is your current bank balance:`)
        .addFields(
          { name: 'Bank Balance', value: `${userBalance.bank} clienterr coins`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Reply with the embed containing the user's bank balance
      await interaction.reply({ embeds: [bankEmbed] });
    } catch (error) {
      console.error('Error fetching bank balance:', error);
      await interaction.reply('There was an error trying to fetch your bank balance.');
    }
  },
};
