import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js' ;
import pagination from '../../utils/buttonPagination.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard based on user balances.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      // Fetch user balances from the database
      const balances = await Balance.find().sort({ balance: -1 }).limit(10); // Limit to top 10 balances

      if (balances.length === 0) {
        return interaction.reply('No users found in the leaderboard.');
      }

      // Build the leaderboard message
      let response = 'Leaderboard:\n';
      balances.forEach((balance, index) => {
        const user = client.users.cache.get(balance.userId);
        response += `${index + 1}. ${user ? user.tag : 'Unknown User'}: ${balance.balance} coins\n`;
      });

      // Create an array of embed pages if the leaderboard has more than 10 users
      const pages = [{ description: response, color: 0x00ff00 }]; // Green color represented as an integer

      // Use pagination to display the leaderboard
      await pagination(interaction, pages);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      interaction.reply('There was an error trying to fetch the leaderboard.');
    }
  },
};
