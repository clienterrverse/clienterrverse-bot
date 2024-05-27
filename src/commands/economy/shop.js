/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Item, Inventory, Balance } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Buy items from the shop.')
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
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Purchase Failed')
          .setDescription('You do not have enough balance to buy this item.')
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
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

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Purchase Successful')
        .setDescription(`You have successfully bought ${quantity} ${item.name}(s) for ${cost} clienterr  clienterr coin.`)
        .addFields(
          { name: 'Item Name', value: item.name, inline: true },
          { name: 'Quantity', value: quantity.toString(), inline: true },
          { name: 'Total Cost', value: `${cost}  clienterr coin`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error processing shop command:', error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error')
        .setDescription('There was an error processing your purchase.')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
    }
  },
};
