/** @format */

import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { Item } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛒 Buy items from the shop.')
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

      // Fetch items from the database
      const items = await Item.find();

      if (items.length === 0) {
        return interaction.reply('❌ No items available in the shop.');
      }

      // Create a select menu with items from the database
      const shopSSM = new StringSelectMenuBuilder()
        .setCustomId('shop')
        .setPlaceholder('🔍 Select an item to buy')
        .addOptions(
          items.map(item => ({
            label: `${item.emoji} ${item.name}`,
            description: `${item.description} - ${item.price} clienterr coin(s)`,
            value: item.itemId,
          }))
        );

      const row = new ActionRowBuilder().addComponents(shopSSM);

      // Send the select menu to the user
      const embed = new EmbedBuilder()
        .setColor('#00acee')
        .setTitle('🛍️ Shop')
        .setDescription('Select an item to buy from the menu below.');

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

    } catch (error) {
      console.error('Error processing shop command:', error);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('❌ Error')
        .setDescription('⚠️ There was an error processing your request.')
        .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};

