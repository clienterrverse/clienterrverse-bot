/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Inventory, Item } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('Displays your inventory.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;

      // Fetch the user's inventory from the database
      const userInventory = await Inventory.findOne({ userId });

      if (!userInventory || userInventory.items.length === 0) {
        return interaction.reply('Your inventory is empty.');
      }

      // Fetch item details for each item in the inventory
      const itemDetailsPromises = userInventory.items.map(async (inventoryItem) => {
        const item = await Item.findOne({ itemId: inventoryItem.itemId });
        return {
          name: item.name,
          description: item.description,
          quantity: inventoryItem.quantity,
        };
      });

      const itemDetails = await Promise.all(itemDetailsPromises);

      // Build the response message
      let response = 'Your inventory:\n';
      itemDetails.forEach(item => {
        response += `**${item.name}**\n`;
        response += `Quantity: ${item.quantity}\n`;
        response += `Description: ${item.description}\n\n`;
      });

      // Reply with the user's inventory
      interaction.reply(response);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      interaction.reply('There was an error trying to fetch your inventory.');
    }
  },
};
