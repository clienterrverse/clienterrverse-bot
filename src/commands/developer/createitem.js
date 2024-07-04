/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';
import mconfig from '../../config/messageConfig.js';

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
        .setMinValue(1)
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
    .addStringOption(option =>
      option.setName('emoji')
        .setDescription('The emoji for the item.')
        .setRequired(false)
    )
    .toJSON(),
  userPermissions: [], 
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
      const category = interaction.options.getString('category') || 'Miscellaneous';
      const emoji = interaction.options.getString('emoji') || '🔹';

      // Check if the item ID already exists
      const existingItem = await Item.findOne({ itemId });
      if (existingItem) {
        return interaction.reply({
          embeds: [createErrorEmbed(interaction, 'Item Already Exists', 'An item with this ID already exists.')],
          ephemeral: true
        });
      }

      // Create and save the new item
      const newItem = await Item.create({
        itemId,
        name,
        price,
        description,
        category,
        emoji
      });

      const embed = new EmbedBuilder()
        .setColor(mconfig.embedColorSuccess)
        .setTitle('✅ Item Created')
        .setDescription(`Item '${name}' has been created with ID '${itemId}', priced at ${price} clienterr coins.`)
        .addFields(
          { name: 'ID', value: itemId, inline: true },
          { name: 'Name', value: name, inline: true },
          { name: 'Price', value: `${price} clienterr coins`, inline: true },
          { name: 'Description', value: description, inline: false },
          { name: 'Category', value: category, inline: true },
          { name: 'Emoji', value: emoji, inline: true }
        )
        .setFooter({
          text: `Created by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error creating item:', error);
      await interaction.reply({
        embeds: [createErrorEmbed(interaction, 'Error', 'There was an error creating the item.')],
        ephemeral: true
      });
    }
  },
};

function createErrorEmbed(interaction, title, description) {
  return new EmbedBuilder()
    .setColor(mconfig.embedColorError)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({
      text: `Requested by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
    })
    .setTimestamp();
}