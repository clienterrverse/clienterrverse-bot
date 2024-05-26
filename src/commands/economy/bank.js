/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';


export default {
  data: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Check your bank balance.")
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

      // Reply with the user's bank balance
      await interaction.reply(`Your bank balance is ${userBalance.bank}.`);
    } catch (error) {
      console.error('Error fetching bank balance:', error);
      await interaction.reply('There was an error trying to fetch your bank balance.');
    }
  },
};
