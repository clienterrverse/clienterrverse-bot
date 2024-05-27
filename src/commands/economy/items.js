/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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

      const pages = items.map((item, index) => {
        return new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('Economy Item')
          .setFooter({ text: `Item ${index + 1} of ${items.length}` })
          .addFields(
            { name: 'Name', value: item.name, inline: true },
            { name: 'ID', value: item.itemId.toString(), inline: true },
            { name: 'Price', value: `${item.price} clienterr  coins`, inline: true },
            { name: 'Description', value: item.description, inline: false },
            { name: 'Category', value: item.category, inline: true }
          );
      });

      // Use the pagination utility to handle pagination
      await pagination(interaction, pages);
    } catch (error) {
      console.error('Error fetching items:', error);
      interaction.reply('There was an error trying to fetch the items.');
    }
  },
};
