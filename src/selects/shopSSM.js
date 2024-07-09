import { Client, EmbedBuilder } from 'discord.js';
import { Balance, Transaction, Item, Inventory } from '../schemas/economy.js';
import mconfig from '../config/messageConfig.js';

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
         const selectedItemId = interaction.values[0];

         const [item, userBalance, userInventory] = await Promise.all([
            Item.findOne({ itemId: selectedItemId }),
            Balance.findOneAndUpdate(
               { userId },
               { $setOnInsert: { userId, balance: 0 } },
               { upsert: true, new: true }
            ),
            Inventory.findOneAndUpdate(
               { userId },
               { $setOnInsert: { userId, items: [] } },
               { upsert: true, new: true }
            ),
         ]);

         if (!item) {
            return interaction.reply({
               content: 'Item not found.',
               ephemeral: true,
            });
         }

         if (userBalance.balance < item.price) {
            return interaction.reply({
               embeds: [
                  createErrorEmbed(
                     interaction,
                     'Purchase Failed',
                     'You do not have enough balance to buy this item.'
                  ),
               ],
               ephemeral: true,
            });
         }

         // Process the purchase
         await processPurchase(userId, item, userBalance, userInventory);

         // Send success message
         await interaction.reply({
            embeds: [createSuccessEmbed(interaction, item)],
            ephemeral: true,
         });
      } catch (error) {
         console.error('Error processing shop command:', error);
         await interaction.reply({
            embeds: [
               createErrorEmbed(
                  interaction,
                  'Error',
                  'There was an error processing your purchase.'
               ),
            ],
            ephemeral: true,
         });
      }
   },
};

async function processPurchase(userId, item, userBalance, userInventory) {
   // Deduct the item price from the user's balance
   userBalance.balance -= item.price;
   await userBalance.save();

   // Update the user's inventory
   const inventoryItem = userInventory.items.find(
      (i) => i.itemId === item.itemId
   );
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
      description: `Purchased ${item.name}`,
   });
   await purchaseTransaction.save();
}

function createSuccessEmbed(interaction, item) {
   return new EmbedBuilder()
      .setColor(mconfig.embedColorSuccess)
      .setTitle('🎉 Purchase Successful')
      .setDescription(
         `🛒 You have successfully bought **${item.name}** for **${item.price}** clienterr coins.`
      )
      .addFields(
         { name: '📦 Item Name', value: item.name, inline: true },
         {
            name: '💰 Price',
            value: `${item.price} clienterr coins`,
            inline: true,
         }
      )
      .setFooter({
         text: `Requested by ${interaction.user.tag}`,
         iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
}

function createErrorEmbed(interaction, title, description) {
   return new EmbedBuilder()
      .setColor(mconfig.embedColorError)
      .setTitle(`❌ ${title}`)
      .setDescription(`⚠️ ${description}`)
      .setFooter({
         text: `Requested by ${interaction.user.tag}`,
         iconURL: interaction.user.displayAvatarURL(),
      })
      .setTimestamp();
}
