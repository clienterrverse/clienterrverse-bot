/** @format */

import {
   SlashCommandBuilder,
   StringSelectMenuBuilder,
   ActionRowBuilder,
   EmbedBuilder,
} from 'discord.js';
import { Item } from '../../schemas/economy.js';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('shop')
      .setDescription('Buy items from the shop.')
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'economy',

   run: async (client, interaction) => {
      try {
         const items = await Item.find().lean();

         if (!items || items.length === 0) {
            return interaction.reply({
               content: '❌ No items available in the shop.',
               ephemeral: true,
            });
         }

         const shopSSM = new StringSelectMenuBuilder()
            .setCustomId('shop')
            .setPlaceholder('Select an item to buy')
            .addOptions(
               items.map((item) => ({
                  label: `${item.emoji} ${item.name}`,
                  description: `${item.description} - ${item.price} clienterr coin(s)`,
                  value: item.itemId,
               }))
            );

         const row = new ActionRowBuilder().addComponents(shopSSM);

         const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('🛍️ Shop')
            .setDescription('Select an item to buy from the menu below.')
            .setFooter({
               text: `Requested by ${interaction.user.tag}`,
               iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

         await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
         });
      } catch (error) {
         await interaction.reply({
            content: '❌ There was a problem retrieving shop items.',
            ephemeral: true,
         });
         throw error;
      }
   },
};
