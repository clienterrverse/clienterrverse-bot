/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('delitem')
    .setDescription('Delete an existing item from the economy system.')
    .addStringOption(option =>
      option.setName('itemid')
        .setDescription('The unique ID of the item to delete.')
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [], // Add permissions check here if necessary
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

      // Check if the item ID exists
      const existingItem = await Item.findOne({ itemId });
      if (!existingItem) {
        const embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setTitle('Error')
          .setDescription('An item with this ID does not exist.');

        return interaction.reply({ embeds: [embed] });
      }

      // Delete the item from the database
      await Item.deleteOne({ itemId });

      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('Item Deleted')
        .setDescription(`Item with ID '${itemId}' has been deleted.`)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error deleting item:', error);
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error')
        .setDescription('There was an error deleting the item.');

      interaction.reply({ embeds: [errorEmbed] });
    }
  },
};
