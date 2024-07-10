/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('delitem')
      .setDescription('Delete an existing item from the economy system.')
      .addStringOption((option) =>
         option
            .setName('itemid')
            .setDescription('The unique ID of the item to delete.')
            .setRequired(true)
      )
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 10,
   nsfwMode: false,
   testMode: false,
   devOnly: true,

   /**
    * Executes the delitem command.
    * @param {Client} client - The Discord client instance.
    * @param {CommandInteraction} interaction - The interaction object.
    */
   run: async (client, interaction) => {
      try {
         const itemId = interaction.options.getString('itemid');

         // Find and delete the item
         const deletedItem = await Item.findOneAndDelete({ itemId });

         if (!deletedItem) {
            return interaction.reply({
               embeds: [
                  createErrorEmbed(
                     interaction,
                     'Item Not Found',
                     'An item with this ID does not exist.'
                  ),
               ],
               ephemeral: true,
            });
         }

         const embed = new EmbedBuilder()
            .setColor(mconfig.embedColorSuccess)
            .setTitle('✅ Item Deleted')
            .setDescription(
               `Item '${deletedItem.name}' with ID '${itemId}' has been deleted.`
            )
            .addFields(
               { name: 'ID', value: deletedItem.itemId, inline: true },
               { name: 'Name', value: deletedItem.name, inline: true },
               {
                  name: 'Price',
                  value: `${deletedItem.price} clienterr coins`,
                  inline: true,
               },
               {
                  name: 'Category',
                  value: deletedItem.category || 'N/A',
                  inline: true,
               }
            )
            .setFooter({
               text: `Deleted by ${interaction.user.username}`,
               iconURL: interaction.user.displayAvatarURL({
                  format: 'png',
                  dynamic: true,
                  size: 1024,
               }),
            })
            .setTimestamp();

         await interaction.reply({ embeds: [embed] });
      } catch (error) {
         await interaction.reply({
            embeds: [
               createErrorEmbed(
                  interaction,
                  'Error',
                  'There was an error deleting the item.'
               ),
            ],
            ephemeral: true,
         });
         throw error;
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
         iconURL: interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 1024,
         }),
      })
      .setTimestamp();
}
