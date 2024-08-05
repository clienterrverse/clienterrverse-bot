import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';
import pagination from '../../utils/buttonPagination.js';

const ITEMS_PER_PAGE = 12;
const LEADERBOARD_LIMIT = 50;

export default {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Displays the leaderboard based on user balances and bank.'),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,
  category: 'economy',

  run: async (client, interaction) => {
    await interaction.deferReply();

    try {
      const balances = await fetchBalances();
      if (balances.length === 0) {
        return interaction.editReply('No users found in the leaderboard.');
      }

      const leaderboardEntries = await createLeaderboardEntries(client, balances);
      const pages = createLeaderboardPages(leaderboardEntries);

      await pagination(interaction, pages);
    } catch (error) {
      console.error('Error in leaderboard command:', error);
      await interaction.editReply('An error occurred while fetching the leaderboard.');
    }
  },
};

async function fetchBalances() {
  return Balance.aggregate([
    {
      $project: {
        userId: 1,
        balance: 1,
        bank: 1,
        totalBalance: { $add: ['$balance', '$bank'] },
      },
    },
    { $sort: { totalBalance: -1 } },
    { $limit: LEADERBOARD_LIMIT },
  ]).exec();
}

async function createLeaderboardEntries(client, balances) {
  return Promise.all(
    balances.map(async (balance, index) => {
      const userTag = await fetchUserTag(client, balance.userId);
      return {
        index: index + 1,
        userTag,
        totalBalance: balance.totalBalance,
        wallet: balance.balance,
        bank: balance.bank,
      };
    })
  );
}

async function fetchUserTag(client, userId) {
  try {
    const user = await client.users.fetch(userId);
    return user.tag;
  } catch {
    return 'Unknown User';
  }
}

function createLeaderboardPages(entries) {
  const pages = [];
  for (let i = 0; i < entries.length; i += ITEMS_PER_PAGE) {
    const pageEntries = entries.slice(i, i + ITEMS_PER_PAGE);
    const embed = createPageEmbed(pageEntries, i, entries.length);
    pages.push(embed);
  }
  return pages;
}

function createPageEmbed(entries, startIndex, totalEntries) {
  const fields = entries.map((entry) => ({
    name: `${getRankEmoji(entry.index)} **${entry.index}. ${entry.userTag}**`,
    value: formatEntryValue(entry),
    inline: true,
  }));

  return new EmbedBuilder()
    .setTitle('🏆 Leaderboard')
    .addFields(fields)
    .setColor(0xffd700)
    .setFooter({
      text: `Page ${Math.floor(startIndex / ITEMS_PER_PAGE) + 1} of ${Math.ceil(totalEntries / ITEMS_PER_PAGE)}`,
    });
}

function getRankEmoji(rank) {
  const emojis = ['🥇', '🥈', '🥉'];
  return emojis[rank - 1] || '🏅';
}

function formatEntryValue(entry) {
  return `Total: ${entry.totalBalance.toLocaleString()} coins\nWallet: ${entry.wallet.toLocaleString()} | Bank: ${entry.bank.toLocaleString()}`;
}