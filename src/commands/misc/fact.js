import {
  SlashCommandBuilder,
  EmbedBuilder,
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import axios from 'axios';
import mConfig from '../../config/messageConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('fact')
    .setDescription('Send a random fact')
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('Choose a fact category')
        .setRequired(false)
        .addChoices(
          { name: 'Random', value: 'random' },
          { name: 'Today', value: 'today' },
          { name: 'Year', value: 'year' },
          { name: 'Science', value: 'science' },
          { name: 'History', value: 'history' },
          { name: 'Animal', value: 'animal' }
        )
    )
    .toJSON(),

  contextMenu: new ContextMenuCommandBuilder()
    .setName('Get Random Fact')
    .setType(ApplicationCommandType.Message)
    .toJSON(),

  userPermissionsBitField: [],
  bot: [],
  category: 'Misc',
  cooldown: 15,
  nsfwMode: false,
  testMode: false,
  devOnly: false,
  prefix: true,

  run: async (client, interaction) => {
    await interaction.deferReply();

    try {
      const category = interaction.options.getString('category') || 'random';
      const fact = await getFact(category);

      const embed = createFactEmbed(fact, category);
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('regenerate_fact')
          .setLabel('Get New Fact')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('share_fact')
          .setLabel('Share Fact')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = (i) =>
        (i.customId === 'regenerate_fact' || i.customId === 'share_fact') &&
        i.user.id === interaction.user.id;

      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 120000,
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'regenerate_fact') {
          const newFact = await getFact(category);
          const newEmbed = createFactEmbed(newFact, category);
          await i.update({ embeds: [newEmbed], components: [row] });
        } else if (i.customId === 'share_fact') {
          await i.reply({
            content: `${interaction.user} shared a fact: ${fact}`,
            allowedMentions: { parse: [] },
          });
        }
      });

      collector.on('end', async () => {
        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('regenerate_fact')
            .setLabel('Get New Fact')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId('share_fact')
            .setLabel('Share Fact')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );
        await interaction.editReply({ components: [disabledRow] });
      });
    } catch (error) {
      console.error('Error in fact command:', error);
      await interaction.editReply({
        content:
          'Sorry, there was an error fetching the fact. Please try again later.',
      });
    }
  },

  handleContext: async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });

    try {
      const fact = await getFact('random');
      const embed = createFactEmbed(fact, 'random');
      await interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error in fact context menu:', error);
      await interaction.editReply({
        content:
          'Sorry, there was an error fetching the fact. Please try again later.',
        ephemeral: true,
      });
    }
  },
};

async function getFact(category) {
  let url;
  switch (category) {
    case 'today':
      url = 'https://uselessfacts.jsph.pl/today.json?language=en';
      break;
    case 'year':
      const currentYear = new Date().getFullYear();
      url = `https://numbersapi.com/${currentYear}/year`;
      break;
    case 'science':
      url =
        'https://uselessfacts.jsph.pl/random.json?language=en&category=science';
      break;
    case 'history':
      url =
        'https://uselessfacts.jsph.pl/random.json?language=en&category=history';
      break;
    case 'math':
      url = 'https://numbersapi.com/random/math';
      break;
    default:
      url = 'https://uselessfacts.jsph.pl/random.json?language=en';
  }

  try {
    const response = await axios.get(url, { timeout: 5000 });
    return category === 'animal'
      ? response.data.fact
      : category === 'year' || category === 'math'
        ? response.data
        : response.data.text;
  } catch (error) {
    console.error(`Error fetching fact from ${url}:`, error.message);
    return 'Unable to fetch a fact at this time. Please try again later.';
  }
}

function createFactEmbed(fact, category) {
  const categoryIcons = {
    random: '🎲',
    today: '📅',
    year: '🗓️',
    science: '🔬',
    history: '📜',
    math: '🔢',
    animal: '🐾',
  };

  return new EmbedBuilder()
    .setColor(mConfig.embedColorSuccess)
    .setTitle(
      `${categoryIcons[category] || '❓'} ${category.charAt(0).toUpperCase() + category.slice(1)} Fact`
    )
    .setDescription(fact)
    .setFooter({
      text: 'Click the button to get a new fact or share this fact',
    })
    .setTimestamp();
}
