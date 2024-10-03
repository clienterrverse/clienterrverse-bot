import {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  SlashCommandBuilder,
} from 'discord.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import mConfig from '../../config/messageConfig.js';

const COMMANDS_PER_PAGE = 6;
const INTERACTION_TIMEOUT = 300000;

const categorizeCommands = (commands) => {
  const categorized = commands.reduce((acc, cmd) => {
    const category = cmd.category || 'Uncategorized';
    if (!acc[category]) acc[category] = [];
    acc[category].push(cmd);
    return acc;
  }, {});

  categorized['Prefix Commands'] = commands.filter((cmd) => cmd.prefix);
  return categorized;
};

export default {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Displays information about commands')
    .addStringOption((option) =>
      option
        .setName('command')
        .setDescription('Specific command to get info about')
        .setRequired(false)
        .setAutocomplete(true)
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('View commands by category')
        .setRequired(false)
        .setAutocomplete(true)
    ),
  run: async (client, interaction) => {
    try {
      const localCommands = await getLocalCommands();
      const embedColor = mConfig.embedColorDefault ?? '#0099ff';
      const prefix = '!';

      const commandOption = interaction.options.getString('command');
      const categoryOption = interaction.options.getString('category');

      if (commandOption) {
        return await showCommandDetails(
          interaction,
          localCommands,
          commandOption,
          embedColor,
          prefix
        );
      }

      if (categoryOption) {
        return await showCategoryCommands(
          interaction,
          localCommands,
          categoryOption,
          embedColor,
          prefix
        );
      }

      return await showCommandOverview(
        interaction,
        localCommands,
        embedColor,
        prefix
      );
    } catch (error) {
      console.error('Error in help command:', error);
      return interaction.reply({
        content: 'An error occurred while fetching help information.',
        ephemeral: true,
      });
    }
  },
};

async function showCommandDetails(
  interaction,
  localCommands,
  commandName,
  embedColor,
  prefix
) {
  const command = localCommands.find(
    (cmd) => cmd.name.toLowerCase() === commandName.toLowerCase()
  );

  if (!command) {
    return interaction.reply({
      content: `Command "${commandName}" not found.`,
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setTitle(`📖 Command: ${command.name}`)
    .setDescription(command.description ?? 'No description available.')
    .setColor(embedColor)
    .addFields(
      {
        name: '🏷️ Category',
        value: command.category ?? 'Uncategorized',
        inline: true,
      },
      { name: '⏳ Cooldown', value: `${command.cooldown ?? 0}s`, inline: true },
      {
        name: '🔒 Permissions',
        value: command.userPermissions?.join(', ') ?? 'None',
        inline: true,
      },
      {
        name: '🔧 Prefix Command',
        value: command.prefix ? 'Yes' : 'No',
        inline: true,
      }
    );

  if (command.aliases?.length > 0) {
    embed.addFields({
      name: '🔀 Aliases',
      value: command.aliases.join(', '),
      inline: true,
    });
  }

  if (command.usage) {
    embed.addFields({
      name: '💡 Usage',
      value: `\`${command.prefix ? prefix : '/'}${command.usage}\``,
      inline: false,
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('return_to_overview')
      .setLabel('Return to Overview')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('show_examples')
      .setLabel('Show Examples')
      .setStyle(ButtonStyle.Primary)
  );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: INTERACTION_TIMEOUT,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({
        content: "You can't use this button.",
        ephemeral: true,
      });
    }

    if (i.customId === 'return_to_overview') {
      await showCommandOverview(i, localCommands, embedColor, prefix);
    } else if (i.customId === 'show_examples') {
      const examplesEmbed = new EmbedBuilder()
        .setTitle(`📝 Examples for ${command.name}`)
        .setColor(embedColor)
        .setDescription(
          command.examples?.join('\n') ?? 'No examples available.'
        );
      await i.reply({ embeds: [examplesEmbed], ephemeral: true });
    }
  });

  collector.on('end', () => {
    row.components.forEach((component) => component.setDisabled(true));
    interaction.editReply({ components: [row] });
  });
}

async function showCategoryCommands(
  interaction,
  localCommands,
  category,
  embedColor,
  prefix
) {
  const categorizedCommands = categorizeCommands(localCommands);
  const matchedCategory = Object.keys(categorizedCommands).find(
    (cat) => cat.toLowerCase() === category.toLowerCase()
  );

  if (!matchedCategory) {
    return interaction.reply({
      content: `Category "${category}" not found.`,
      ephemeral: true,
    });
  }

  const categoryCommands = categorizedCommands[matchedCategory];

  if (categoryCommands.length === 0) {
    return interaction.reply({
      content: `No commands found in the "${matchedCategory}" category.`,
      ephemeral: true,
    });
  }

  const pages = createCommandPages(
    categoryCommands,
    matchedCategory,
    embedColor,
    prefix
  );
  let currentPage = 0;

  const row = createPaginationRow(pages.length);

  const response = await interaction.reply({
    embeds: [pages[currentPage]],
    components: [row],
  });

  const collector = response.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: INTERACTION_TIMEOUT,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({
        content: "You can't use this button.",
        ephemeral: true,
      });
    }

    switch (i.customId) {
      case 'prev_page':
        currentPage = Math.max(0, currentPage - 1);
        break;
      case 'next_page':
        currentPage = Math.min(pages.length - 1, currentPage + 1);
        break;
      case 'return_to_overview':
        await showCommandOverview(i, localCommands, embedColor, prefix);
        return;
    }

    updatePaginationRow(row, currentPage, pages.length);
    await i.update({ embeds: [pages[currentPage]], components: [row] });
  });

  collector.on('end', () => {
    row.components.forEach((component) => component.setDisabled(true));
    interaction.editReply({ components: [row] });
  });
}

async function showCommandOverview(
  interaction,
  localCommands,
  embedColor,
  prefix
) {
  const categorizedCommands = categorizeCommands(localCommands);
  const categories = Object.keys(categorizedCommands);

  const overviewEmbed = createOverviewEmbed(
    categorizedCommands,
    embedColor,
    prefix
  );

  const categorySelect = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('category_select')
      .setPlaceholder('Select a category')
      .addOptions(
        categories.map((cat) => ({
          label: cat,
          value: cat,
          emoji: getCategoryEmoji(cat),
        }))
      )
  );

  const response = await interaction.reply({
    embeds: [overviewEmbed],
    components: [categorySelect],
  });

  const collector = response.createMessageComponentCollector({
    time: INTERACTION_TIMEOUT,
  });

  collector.on('collect', async (i) => {
    if (i.user.id !== interaction.user.id) {
      return i.reply({ content: "You can't use this menu.", ephemeral: true });
    }

    if (i.customId === 'category_select') {
      await showCategoryCommands(
        i,
        localCommands,
        i.values[0],
        embedColor,
        prefix
      );
    }
  });

  collector.on('end', () => {
    categorySelect.components.forEach((component) =>
      component.setDisabled(true)
    );
    interaction.editReply({ components: [categorySelect] });
  });
}

function createOverviewEmbed(categorizedCommands, embedColor, prefix) {
  return new EmbedBuilder()
    .setTitle('📜 Command Categories')
    .setDescription(
      'Use the menu below to select a category or use `/help <command>` for specific command details.'
    )
    .setColor(embedColor)
    .addFields(
      Object.entries(categorizedCommands).map(([category, commands]) => ({
        name: `${getCategoryEmoji(category)} ${category}`,
        value: `${commands.length} command${commands.length !== 1 ? 's' : ''}`,
        inline: true,
      }))
    )
    .setFooter({ text: `Prefix for legacy commands: ${prefix}` });
}

function createCommandPages(categoryCommands, category, embedColor, prefix) {
  const pages = [];

  for (let i = 0; i < categoryCommands.length; i += COMMANDS_PER_PAGE) {
    const commandsSlice = categoryCommands.slice(i, i + COMMANDS_PER_PAGE);
    const embed = new EmbedBuilder()
      .setTitle(`${getCategoryEmoji(category)} ${category} Commands`)
      .setColor(embedColor)
      .setDescription('Here are the available commands:')
      .addFields(
        commandsSlice.map((cmd) => ({
          name: `\`${cmd.prefix ? prefix : '/'}${cmd.name}\``,
          value: cmd.description ?? 'No description available.',
          inline: false,
        }))
      )
      .setFooter({
        text: `Page ${pages.length + 1}/${Math.ceil(categoryCommands.length / COMMANDS_PER_PAGE)}`,
      });

    pages.push(embed);
  }

  return pages;
}

function createPaginationRow(pageCount) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev_page')
      .setLabel('◀️ Previous')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId('next_page')
      .setLabel('Next ▶️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(pageCount <= 1),
    new ButtonBuilder()
      .setCustomId('return_to_overview')
      .setLabel('🔍 Overview')
      .setStyle(ButtonStyle.Secondary)
  );
}

function updatePaginationRow(row, currentPage, pageCount) {
  row.components[0].setDisabled(currentPage === 0);
  row.components[1].setDisabled(currentPage === pageCount - 1);
}

function getCategoryEmoji(category) {
  const emojis = {
    General: '🌐',
    Moderation: '🔨',
    Fun: '🎉',
    Utility: '⚙️',
    Music: '🎵',
    'Prefix Commands': '🔧',
    Uncategorized: '❓',
  };

  return emojis[category] || '📁';
}
