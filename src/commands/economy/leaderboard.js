import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';
import pagination from '../../utils/buttonPagination.js';
import mongoose from 'mongoose';

export default {
   data: new SlashCommandBuilder()
      .setName('leaderboard')
      .setDescription(
         'Displays the leaderboard based on user balances and bank.'
      ),
   userPermissions: [],
   botPermissions: [],
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
         // Defer the interaction
         await interaction.deferReply();

         // Use aggregation to fetch user balances sorted by the sum of balance and bank in descending order
         const balances = await Balance.aggregate([
            {
               $project: {
                  userId: 1,
                  balance: 1,
                  bank: 1,
                  totalBalance: { $add: ['$balance', '$bank'] },
               },
            },
            {
               $sort: { totalBalance: -1 },
            },
            {
               $limit: 100,
            },
         ]).exec();

         if (balances.length === 0) {
            return interaction.editReply('No users found in the leaderboard.');
         }

         // Function to fetch user details
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
               const userTag = await fetchUserDetails(balance.userId);
               const totalBalance = balance.totalBalance;
               return {
                  index: index + 1,
                  userTag,
                  totalBalance,
                  wallet: balance.balance,
                  bank: balance.bank,
               };
            })
         );

         // Split leaderboard entries into pages of 10 entries each
         const itemsPerPage = 10;
         const pages = [];
         for (let i = 0; i < leaderboardEntries.length; i += itemsPerPage) {
            const pageContent = leaderboardEntries
               .slice(i, i + itemsPerPage)
               .map(
                  (entry) =>
                     `${entry.index === 1 ? '🥇' : entry.index === 2 ? '🥈' : entry.index === 3 ? '🥉' : '🏅'} **${entry.index}. ${entry.userTag}**\nTotal: ${entry.totalBalance.toLocaleString()} coins\nWallet: ${entry.wallet.toLocaleString()} | Bank: ${entry.bank.toLocaleString()}\n`
               )
               .join('\n');

            const embed = new EmbedBuilder()
               .setTitle('🏆 Leaderboard')
               .setDescription(pageContent)
               .setColor(0xffd700) // Gold color
               .setFooter({
                  text: `Page ${Math.floor(i / itemsPerPage) + 1} of ${Math.ceil(leaderboardEntries.length / itemsPerPage)}`,
               });

            pages.push(embed);
         }

         // Use pagination to display the leaderboard
         await pagination(interaction, pages);
      
   },
};
