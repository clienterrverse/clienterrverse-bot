import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  EmbedBuilder,
} from 'discord.js';

/**
 * Creates a button with enhanced features like hover effects and tooltips.
 * @param {string} customId - The custom ID of the button.
 * @param {string} emoji - The emoji to display on the button.
 * @param {ButtonStyle} style - The style of the button.
 * @param {boolean} [disabled=false] - Whether the button is disabled.
 * @returns {ButtonBuilder} The created button.
 */
const createButton = (customId, emoji, style, disabled = false) => {
  return new ButtonBuilder()
    .setCustomId(customId)
    .setEmoji(emoji)
    .setStyle(style)
    .setDisabled(disabled)
    .setLabel(customId.charAt(0).toUpperCase() + customId.slice(1));
};

/**
 * Updates the state of buttons based on the current index and total pages.
 * @param {Array<ButtonBuilder>} buttons - The array of buttons to update.
 * @param {number} index - The current index.
 * @param {number} totalPages - The total number of pages.
 */
const updateButtons = (buttons, index, totalPages) => {
  buttons.forEach((button) => {
    switch (button.data.custom_id) {
      case 'first':
        button.setDisabled(index === 0);
        break;
      case 'prev':
        button.setDisabled(index === 0);
        break;
      case 'next':
        button.setDisabled(index === totalPages - 1);
        break;
      case 'last':
        button.setDisabled(index === totalPages - 1);
        break;
    }
    button.setStyle(ButtonStyle.Primary); // Ensure all buttons maintain Primary style
  });
};

/**
 * Animates the transition between pages with a progress indicator.
 * @param {Message} msg - The message to edit.
 * @param {EmbedBuilder} newEmbed - The new embed to display.
 * @param {number} currentPage - The current page number.
 * @param {number} totalPages - The total number of pages.
 */
const animateTransition = async (msg, newEmbed, currentPage, totalPages) => {
  const loadingEmbed = new EmbedBuilder()
    .setDescription('Loading...')
    .setColor('#FFA500')
    .setFooter({ text: `Changing page... ${currentPage}/${totalPages}` });

  await msg.edit({ embeds: [loadingEmbed] });
  await new Promise((resolve) => setTimeout(resolve, 300));

  const fadeEmbed = new EmbedBuilder(newEmbed.data)
    .setColor('#FFFFFF')
    .setFooter({ text: `Page ${currentPage}/${totalPages}` });

  await msg.edit({ embeds: [fadeEmbed] });
  await new Promise((resolve) => setTimeout(resolve, 200));

  await msg.edit({ embeds: [newEmbed] });
};

/**
 * Represents an enhanced LRU Cache with improved analytics.
 */
class EnhancedLRUCache {
  /**
   * Creates a new EnhancedLRUCache instance.
   * @param {number} capacity - The maximum size of the cache.
   */
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    this.hits = 0;
    this.misses = 0;
    this.totalAccesses = 0;
  }

  /**
   * Retrieves a value from the cache.
   * @param {string} key - The key to retrieve.
   * @returns {(any|undefined)} The value if found, otherwise undefined.
   */
  get(key) {
    this.totalAccesses++;
    if (!this.cache.has(key)) {
      this.misses++;
      return undefined;
    }
    this.hits++;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * Adds a value to the cache.
   * @param {string} key - The key to add.
   * @param {any} value - The value to add.
   */
  put(key, value) {
    if (this.cache.size >= this.capacity) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, value);
  }

  /**
   * Prefetches a value into the cache if it's not already present.
   * @param {string} key - The key to prefetch.
   * @param {Function} getValue - A function to retrieve the value if not cached.
   */
  prefetch(key, getValue) {
    if (!this.cache.has(key)) {
      const value = getValue(key);
      this.put(key, value);
    }
  }

  /**
   * Clears the cache.
   */
  clear() {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.totalAccesses = 0;
  }

  /**
   * Returns analytics about the cache.
   * @returns {Object} An object containing cache analytics.
   */
  getAnalytics() {
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: this.hits / this.totalAccesses || 0,
      efficiency: this.hits / this.capacity || 0,
    };
  }
}

/**
 * Creates an advanced pagination system with enhanced user experience.
 * @param {Interaction} interaction - The interaction that triggered the pagination.
 * @param {Array<EmbedBuilder>} pages - An array of embeds to paginate.
 * @param {Object} [options={}] - Customization options.
 */
export default async (interaction, pages, options = {}) => {
  try {
    if (!interaction) throw new Error('Invalid interaction');
    if (!pages || !Array.isArray(pages) || pages.length === 0)
      throw new Error('Invalid pages array');

    const defaultOptions = {
      time: 10 * 60 * 1000,
      buttonEmojis: {
        first: '⏮️',
        prev: '⬅️',
        next: '➡️',
        last: '⏭️',
      },
      buttonStyles: {
        first: ButtonStyle.Primary,
        prev: ButtonStyle.Primary,
        next: ButtonStyle.Primary,
        last: ButtonStyle.Primary,
      },
      animateTransitions: true,
      cacheSize: 15,
      showPageIndicator: true,
      allowUserNavigation: true,
    };

    const mergedOptions = { ...defaultOptions, ...options };

    if (!interaction.deferred) await interaction.deferReply();

    if (pages.length === 0) {
      return await interaction.editReply({
        content:
          'No content available at the moment. Please check back later or contact support if this persists.',
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
        mergedOptions.buttonStyles.first
      ),
      createButton(
        'prev',
        mergedOptions.buttonEmojis.prev,
        mergedOptions.buttonStyles.prev
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

    const embedCache = new EnhancedLRUCache(mergedOptions.cacheSize);

    const getEmbed = (index) => {
      let embed = embedCache.get(index);
      if (!embed) {
        embed = new EmbedBuilder(pages[index].data);
        if (mergedOptions.showPageIndicator) {
          embed.setFooter({
            text: `Page ${index + 1} of ${pages.length} | Use buttons to navigate`,
          });
        }
        embedCache.put(index, embed);
      }
      return embed;
    };

    const prefetchAdjacentPages = (currentIndex) => {
      const prefetchIndexes = [
        currentIndex - 1,
        currentIndex + 1,
        currentIndex - 2,
        currentIndex + 2,
      ];
      prefetchIndexes.forEach((idx) => {
        if (idx >= 0 && idx < pages.length) {
          embedCache.prefetch(idx, getEmbed);
        }
      });
    };

    updateButtons(buttons, index, pages.length);
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
      if (
        !mergedOptions.allowUserNavigation &&
        i.user.id !== interaction.user.id
      ) {
        return i.reply({
          content: 'You are not authorized to navigate this content.',
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
        case 'next':
          index = Math.min(pages.length - 1, index + 1);
          break;
        case 'last':
          index = pages.length - 1;
          break;
      }

      updateButtons(buttons, index, pages.length);

      await msg.edit({
        embeds: [pages[index]],
        components: [row],
      });

      collector.resetTimer();
    });

    collector.on('end', async () => {
      buttons.forEach((button) => button.setDisabled(true));
      const finalEmbed = new EmbedBuilder(getEmbed(index).data).setFooter({
        text: 'This pagination session has ended. Use the command again to start a new session.',
      });

      await msg
        .edit({
          embeds: [finalEmbed],
          components: [row],
        })
        .catch(() => null);

      const analytics = embedCache.getAnalytics();
      console.log('Pagination Analytics:', analytics);
      console.log(`Total interactions: ${usageCount}`);
      embedCache.clear();
    });

    return msg;
  } catch (err) {
    console.error('Pagination error:', err);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content:
          'An unexpected error occurred while setting up the content. Please try again or contact support if the issue persists.',
        ephemeral: true,
      });
    } else {
      await interaction.editReply({
        content:
          'An unexpected error occurred while displaying the content. Please try again or contact support if the issue persists.',
      });
    }
  }
};
