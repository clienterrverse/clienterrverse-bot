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
      const userId = interaction.user.id;

      // Fetch the user's inventory from the database
      const userInventory = await Inventory.findOne({ userId });

      if (!userInventory || userInventory.items.length === 0) {
         return interaction.reply('Your inventory is empty.');
      }

      // Fetch item details for each item in the inventory
      const itemDetailsPromises = userInventory.items.map(
         async (inventoryItem) => {
            const item = await Item.findOne({
               itemId: inventoryItem.itemId,
            });
            return {
               name: item.name,
               description: item.description,
               quantity: inventoryItem.quantity,
            };
         }
      );

      const itemDetails = await Promise.all(itemDetailsPromises);

      // Build the response as an Embed
      const embed = {
         color: 0x00ff00, // Green color for positive response
         title: 'Your Inventory',
         description: 'Here is a list of items in your inventory:',
         fields: itemDetails.map((item) => ({
            name: item.name,
            value: `Quantity: ${item.quantity}\nDescription: ${item.description}`,
         })),
      };

      // Reply with the user's inventory as an Embed
      interaction.reply({ embeds: [embed] });
   },
};
