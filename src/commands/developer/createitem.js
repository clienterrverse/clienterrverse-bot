/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('createitem')
    .setDescription('Create a new item for the economy system.')
    .addStringOption(option =>
      option.setName('itemid')
        .setDescription('The unique ID for the item.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('name')
        .setDescription('The name of the item.')
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName('price')
        .setDescription('The price of the item.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('description')
        .setDescription('A description of the item.')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('category')
        .setDescription('The category of the item.')
        .setRequired(false)
    )
    .toJSON(),
  userPermissions: [], // Ensures only users with the 'ADMINISTRATOR' permission can use this command
  botPermissions: [],
  cooldown: 10,
  nsfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    try {
      const itemId = interaction.options.getString('itemid');
      const name = interaction.options.getString('name');
      const price = interaction.options.getInteger('price');
      const description = interaction.options.getString('description');
      const category = interaction.options.getString('category') || 'misc';

      // Check if the item ID already exists
      const existingItem = await Item.findOne({ itemId });
      if (existingItem) {
        return interaction.reply('An item with this ID already exists.');
      }

      // Create a new item
      const newItem = new Item({
        itemId,
        name,
        price,
        description,
        category,
      });

      // Save the item to the database
      await newItem.save();

      interaction.reply(`Item '${name}' has been created with ID '${itemId}', priced at ${price} coins.`);
    } catch (error) {
      console.error('Error creating item:', error);
      interaction.reply('There was an error creating the item.');
    }
  },
};
