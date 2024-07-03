import { Client, EmbedBuilder } from 'discord.js';
import { Balance, Transaction, Item, Inventory } from '../schemas/economy.js';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
  customId: 'shop',
  botPermissions: [],

  /**
   * @param {Client} client
   * @param {Interaction} interaction
   */
  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const selectedItemId = interaction.values[0]; // Get the selected item ID from the interaction

      // Fetch the selected item from the database
      const item = await Item.findOne({ itemId: selectedItemId });
      if (!item) {
        return interaction.reply('Item not found.');
      }

      // Fetch the user's balance from the database
      let userBalance = await Balance.findOne({ userId });
      if (!userBalance) {
        userBalance = new Balance({ userId });
        await userBalance.save();
      }

      // Check if the user has enough balance to buy the item
      if (userBalance.balance < item.price) {
        const embed = new EmbedBuilder()
          .setColor(mconfig.embedColorError)
          .setTitle('❌ Purchase Failed')
          .setDescription('💸 You do not have enough balance to buy this item.')
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();
        return interaction.reply({ embeds: [embed], ephemeral: true});
      }

      // Deduct the item price from the user's balance
      userBalance.balance -= item.price;
      await userBalance.save();

      // Update the user's inventory
      let userInventory = await Inventory.findOne({ userId });
      if (!userInventory) {
        userInventory = new Inventory({ userId, items: [] });
      }

      const inventoryItem = userInventory.items.find(i => i.itemId === item.itemId);
      if (inventoryItem) {
        inventoryItem.quantity += 1;
      } else {
        userInventory.items.push({ itemId: item.itemId, quantity: 1 });
      }

      await userInventory.save();

      // Create a transaction record
      const purchaseTransaction = new Transaction({
        userId: userId,
        type: 'purchase',
        amount: item.price,
        description: `Purchased ${item.name}`
      });
      await purchaseTransaction.save();

      // Create an embed to display the purchase information
      const embed = new EmbedBuilder()
        .setColor(mconfig.embedColorSuccess)
        .setTitle('🎉 Purchase Successful')
        .setDescription(`🛒 You have successfully bought **${item.name}** for **${item.price}** clienterr coins.`)
        .addFields(
          { name: '📦 Item Name', value: item.name, inline: true },
          { name: '💰 Price', value: `${item.price} clienterr coins`, inline: true }
        )
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();

      // Send the embed as the reply
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error processing shop command:', error);
      const embed = new EmbedBuilder()
        .setColor(mconfig.embedColorError)
        .setTitle('❌ Error')
        .setDescription('⚠️ There was an error processing your purchase.')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
