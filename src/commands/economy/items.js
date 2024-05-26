/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';
import pagination from '../../utils/buttonPagination.js';


export default {
  data: new SlashCommandBuilder()
    .setName('items')
    .setDescription('Displays all items in the economy system.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      // Fetch all items from the database
      const items = await Item.find();

      if (items.length === 0) {
        return interaction.reply('No items found in the economy system.');
      }
      const pages = [];
      let currentPage = '';

      items.forEach((item, index) => {
        currentPage += `**${item.name}**\n`;
        currentPage += `ID: ${item.itemId}\n`;
        currentPage += `Price: ${item.price} coins\n`;
        currentPage += `Description: ${item.description}\n`;
        currentPage += `Category: ${item.category}\n\n`;

        // Check if the current page reaches the maximum items per page or it's the last item
        if ((index + 1) % 10 === 0 || index === items.length - 1) {
          pages.push({ description: currentPage });
          currentPage = ''; // Reset the current page
        }
      });

      // Reply with the list of items
      await pagination(interaction, pages);
    } catch (error) {
      console.error('Error fetching items:', error);
      interaction.reply('There was an error trying to fetch the items.');
    }
  },
};
