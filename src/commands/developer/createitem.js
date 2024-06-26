/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
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
  userPermissions: [], // Add permissions check here if necessary
  botPermissions: [],
  cooldown: 10,
  nsfwMode: false,
  testMode: false,
  devOnly: true,

  /**
   * Executes the createitem command.
   * @param {Client} client - The Discord client instance.
   * @param {CommandInteraction} interaction - The interaction object.
   */


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
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('An item with this ID already exists.');

        return interaction.reply({ embeds: [embed] });
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

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Item Created')
        .setDescription(`Item '${name}' has been created with ID '${itemId}', priced at ${price} clienterr coins.`)
        .addFields(
          { name: 'ID', value: itemId, inline: true },
          { name: 'Name', value: name, inline: true },
          { name: 'Price', value: `${price} clienterr coins`, inline: true },
          { name: 'Description', value: description, inline: false },
          { name: 'Category', value: category, inline: true }
        )
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating item:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error')
        .setDescription('There was an error creating the item.');

      interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
