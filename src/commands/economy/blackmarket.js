/** @format */

import { SlashCommandBuilder , EmbedBuilder } from 'discord.js';
import { Item, Inventory, Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('blackmarket')
    .setDescription('Buy items from the black market.')
    .addStringOption(option =>
      option.setName('item')
        .setDescription('The ID of the item you want to buy.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('quantity')
        .setDescription('The quantity of the item you want to buy.')
        .setRequired(true)
    )
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
      const itemId = interaction.options.getString('item');
      const quantity = interaction.options.getInteger('quantity');

      const item = await Item.findOne({ itemId });
      if (!item) {
        return interaction.reply('Item not found.');
      }

      const cost = item.price * quantity;
      let userBalance = await Balance.findOne({ userId });

      if (!userBalance || userBalance.balance < cost) {
        return interaction.reply('You do not have enough balance to buy this item.');
      }

      userBalance.balance -= cost;
      await userBalance.save();

      let userInventory = await Inventory.findOne({ userId });
      if (!userInventory) {
        userInventory = new Inventory({ userId, items: [] });
      }

      const inventoryItem = userInventory.items.find(i => i.itemId === itemId);
      if (inventoryItem) {
        inventoryItem.quantity += quantity;
      } else {
        userInventory.items.push({ itemId, quantity });
      }


      await userInventory.save();
      interaction.reply(`You have successfully bought ${quantity} ${item.name}(s) for ${cost} coins.`);
    } catch (error) {
      console.error('Error processing blackmarket command:', error);
      interaction.reply('There was an error processing your blackmarket purchase.');
    }
  },
};
