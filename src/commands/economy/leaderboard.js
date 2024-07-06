/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';
import pagination from '../../utils/buttonPagination.js';

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard based on user balances and bank.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      // Use aggregation to fetch user balances sorted by the sum of balance and bank in descending order
      const balances = await Balance.aggregate([
        {
          $addFields: {
            totalBalance: { $sum: ['$balance', '$bank'] },
          },
        },
        {
          $sort: { totalBalance: -1 },
        },
        {
          $limit: 100,
        },
      ]);

      if (balances.length === 0) {
        return interaction.reply('No users found in the leaderboard.');
      }

      const fetchUserDetails = async (userId) => {
        try {
          const user = await client.users.fetch(userId);
          return user.tag;
        } catch {
          return 'Unknown User';
        }
      };

      // Create an array to hold the leaderboard entries
      const leaderboardEntries = await Promise.all(
        balances.map(async (balance, index) => {
          const user = client.users.cache.get(balance.userId);
          const userTag = user
            ? user.tag
            : await fetchUserDetails(balance.userId);
          const totalBalance = balance.totalBalance;
          return `${index + 1}. ${userTag}: ${totalBalance} clienterr coins (Wallet: ${balance.balance}, Bank: ${balance.bank})\n`;
        })
      );

      // Split leaderboard entries into pages of 10 entries each
      const itemsPerPage = 10;
      const pages = [];
      for (let i = 0; i < leaderboardEntries.length; i += itemsPerPage) {
        const pageContent = leaderboardEntries
          .slice(i, i + itemsPerPage)
          .join('');
        pages.push({
          title: 'Leaderboard',
          description: pageContent,
          color: 0x00ff00, // Green color
        });
      }

      // Use pagination to display the leaderboard
      await pagination(interaction, pages);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      await interaction.reply(
        'There was an error trying to fetch the leaderboard. Please try again later.'
      );
    }
  },
};
