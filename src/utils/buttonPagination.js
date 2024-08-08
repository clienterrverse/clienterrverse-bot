import {
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   ComponentType,
   EmbedBuilder,
} from 'discord.js';

// Utility function to create a button
const createButton = (customId, emoji, style, disabled = false) => {
   return new ButtonBuilder()
      .setCustomId(customId)
      .setEmoji(emoji)
      .setStyle(style)
      .setDisabled(disabled);
};

// Enhanced button state management
const updateButtons = (buttons, index, pagesLength) => {
   buttons.forEach((button) => {
      switch (button.data.custom_id) {
         case 'first':
         case 'prev':
         case 'home':
            button.setDisabled(index === 0);
            break;
         case 'next':
         case 'last':
            button.setDisabled(index === pagesLength - 1);
            break;
      }
   });
};

// Animated transition helper
const animateTransition = async (msg, newEmbed) => {
   const loadingEmbed = new EmbedBuilder()
      .setDescription('Loading...')
      .setColor('#FFA500');

   await msg.edit({ embeds: [loadingEmbed] });
   await new Promise((resolve) => setTimeout(resolve, 300));
   await msg.edit({ embeds: [newEmbed] });
};

// LRU Cache implementation for efficient embed caching
class LRUCache {
   constructor(capacity) {
      this.capacity = capacity;
      this.cache = new Map();
   }

   get(key) {
      if (!this.cache.has(key)) return undefined;
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
   }

   put(key, value) {
      if (this.cache.size >= this.capacity) {
         const oldestKey = this.cache.keys().next().value;
         this.cache.delete(oldestKey);
      }
      this.cache.set(key, value);
   }
}

/**
 * Creates an advanced pagination system using buttons.
 * @param {Interaction} interaction The interaction that triggered the pagination.
 * @param {Array<EmbedBuilder>} pages An array of embeds to paginate.
 * @param {Object} options Customization options
 */
export default async (interaction, pages, options = {}) => {
   try {
      if (!interaction) throw new Error('Invalid interaction');
      if (!pages || !Array.isArray(pages) || pages.length === 0)
         throw new Error('Invalid pages array');

      const defaultOptions = {
         time: 5 * 60 * 1000, // 5 minutes
         buttonEmojis: {
            first: '⏮️',
            prev: '⬅️',
            home: '🏠',
            next: '➡️',
            last: '⏭️',
         },
         buttonStyles: {
            first: ButtonStyle.Primary,
            prev: ButtonStyle.Primary,
            home: ButtonStyle.Secondary,
            next: ButtonStyle.Primary,
            last: ButtonStyle.Primary,
         },
         animateTransitions: true,
         cacheSize: 10,
      };

      const mergedOptions = { ...defaultOptions, ...options };

      if (!interaction.deferred) await interaction.deferReply();

      // Handle edge cases
      if (pages.length === 0) {
         return await interaction.editReply({
            content: 'No pages to display.',
            components: [],
         });
      }

      if (pages.length === 1) {
         return await interaction.editReply({
            embeds: pages,
            components: [],
         });
      }

      const buttons = [
         createButton(
            'first',
            mergedOptions.buttonEmojis.first,
            mergedOptions.buttonStyles.first,
            true
         ),
         createButton(
            'prev',
            mergedOptions.buttonEmojis.prev,
            mergedOptions.buttonStyles.prev,
            true
         ),
         createButton(
            'home',
            mergedOptions.buttonEmojis.home,
            mergedOptions.buttonStyles.home,
            true
         ),
         createButton(
            'next',
            mergedOptions.buttonEmojis.next,
            mergedOptions.buttonStyles.next
         ),
         createButton(
            'last',
            mergedOptions.buttonEmojis.last,
            mergedOptions.buttonStyles.last
         ),
      ];

      const row = new ActionRowBuilder().addComponents(buttons);
      let index = 0;

      // Implement LRU Cache for embed caching
      const embedCache = new LRUCache(mergedOptions.cacheSize);

      const getEmbed = (index) => {
         let embed = embedCache.get(index);
         if (!embed) {
            embed = pages[index].setFooter({
               text: `Page ${index + 1} of ${pages.length} | Total Items: ${pages.length}`,
            });
            embedCache.put(index, embed);
         }
         return embed;
      };

      const msg = await interaction.editReply({
         embeds: [getEmbed(index)],
         components: [row],
         fetchReply: true,
      });

      const collector = msg.createMessageComponentCollector({
         componentType: ComponentType.Button,
         time: mergedOptions.time,
      });

      let usageCount = 0;

      collector.on('collect', async (i) => {
         if (i.user.id !== interaction.user.id) {
            return i.reply({
               content: 'You are not allowed to interact with this pagination.',
               ephemeral: true,
            });
         }

         await i.deferUpdate();
         usageCount++;

         const oldIndex = index;

         switch (i.customId) {
            case 'first':
               index = 0;
               break;
            case 'prev':
               index = Math.max(0, index - 1);
               break;
            case 'home':
               index = 0;
               break;
            case 'next':
               index = Math.min(pages.length - 1, index + 1);
               break;
            case 'last':
               index = pages.length - 1;
               break;
         }

         updateButtons(buttons, index, pages.length);

         if (mergedOptions.animateTransitions && oldIndex !== index) {
            await animateTransition(msg, getEmbed(index));
         } else {
            await msg.edit({
               embeds: [getEmbed(index)],
               components: [row],
            });
         }

         collector.resetTimer();
      });

      collector.on('end', async () => {
         buttons.forEach((button) => button.setDisabled(true));
         await msg
            .edit({
               embeds: [getEmbed(index)],
               components: [row],
            })
            .catch(() => null);

         // Log usage statistics
         console.log(`Pagination ended. Total interactions: ${usageCount}`);
      });

      return msg;
   } catch (err) {
      console.error('Pagination error:', err);
      if (!interaction.replied && !interaction.deferred) {
         await interaction.reply({
            content: 'An error occurred while setting up pagination.',
            ephemeral: true,
         });
      } else {
         await interaction.editReply({
            content: 'An error occurred while setting up pagination.',
         });
      }
      // Assuming you have an error handling system
      if (typeof client !== 'undefined' && client.errorHandler) {
         await client.errorHandler.handleError(err, { type: 'Pagination' });
      }
   }
};
