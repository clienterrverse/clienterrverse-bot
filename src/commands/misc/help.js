import {
   SlashCommandBuilder,
   EmbedBuilder,
   ActionRowBuilder,
   StringSelectMenuBuilder,
   ButtonBuilder,
   ButtonStyle,
   ComponentType,
} from 'discord.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import mConfig from '../../config/messageConfig.js';

const MAX_DESCRIPTION_LENGTH = 2048;
const COMMANDS_PER_PAGE = 10;
const MAX_FIELD_LENGTH = 1024;
const INTERACTION_TIMEOUT = 300000; // 5 minutes

const splitText = (text, length) => {
   return text.match(new RegExp(`.{1,${length}}`, 'g')) || [];
};

const categorizeCommands = (commands) => {
   const categories = {};
   commands.forEach((cmd) => {
      const category = cmd.category || 'Uncategorized';
      if (!categories[category]) {
         categories[category] = [];
      }
      categories[category].push(cmd);
   });
   return categories;
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
      )
      .toJSON(),

   userPermissions: [],
   botPermissions: [],
   cooldown: 10,
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'Misc',

   async autocomplete(client, interaction) {
      const focusedOption = interaction.options.getFocused(true);
      const localCommands = await getLocalCommands();

      if (focusedOption.name === 'command') {
         const filtered = localCommands.filter((cmd) =>
            cmd.data.name
               .toLowerCase()
               .startsWith(focusedOption.value.toLowerCase())
         );
         await interaction.respond(
            filtered.map((cmd) => ({
               name: cmd.data.name,
               value: cmd.data.name,
            }))
         );
      } else if (focusedOption.name === 'category') {
         const categories = [
            ...new Set(
               localCommands.map((cmd) => cmd.category || 'Uncategorized')
            ),
         ];
         const filtered = categories.filter((cat) =>
            cat.toLowerCase().startsWith(focusedOption.value.toLowerCase())
         );
         await interaction.respond(
            filtered.map((cat) => ({
               name: cat,
               value: cat,
            }))
         );
      }
   },

   run: async (client, interaction) => {
      try {
         const localCommands = await getLocalCommands();
         const commandName = interaction.options.getString('command');
         const category = interaction.options.getString('category');
         const embedColor = mConfig.embedColorDefault || '#0099ff';

         if (commandName) {
            return await showCommandDetails(
               interaction,
               localCommands,
               commandName,
               embedColor
            );
         } else if (category) {
            return await showCategoryCommands(
               interaction,
               localCommands,
               category,
               embedColor
            );
         } else {
            return await showCommandOverview(
               interaction,
               localCommands,
               embedColor
            );
         }
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
   embedColor
) {
   const command = localCommands.find(
      (cmd) => cmd.data.name.toLowerCase() === commandName.toLowerCase()
   );
   if (!command) {
      return interaction.reply({
         content: 'Command not found.',
         ephemeral: true,
      });
   }

   const embed = new EmbedBuilder()
      .setTitle(`📖 Command: ${command.data.name}`)
      .setDescription(command.data.description || 'No description available.')
      .setColor(embedColor)
      .addFields(
         {
            name: '🏷️ Category',
            value: command.category || 'Uncategorized',
            inline: true,
         },
         {
            name: '⏳ Cooldown',
            value: `${command.cooldown || 0}s`,
            inline: true,
         },
         {
            name: '🔒 Permissions',
            value: command.userPermissions?.join(', ') || 'None',
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
         value: `\`${command.usage}\``,
         inline: false,
      });
   }

   if (command.data.options?.length > 0) {
      const optionsText = command.data.options
         .map(
            (opt) =>
               `• **${opt.name}**: ${opt.description} ${
                  opt.required ? '*(Required)*' : ''
               }`
         )
         .join('\n');
      embed.addFields({
         name: '🔧 Options',
         value: optionsText,
         inline: false,
      });
   }

   const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setCustomId('return_to_overview')
         .setLabel('Return to Overview')
         .setStyle(ButtonStyle.Secondary)
   );

   const message = await interaction.reply({
      embeds: [embed],
      components: [row],
   });

   const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: INTERACTION_TIMEOUT,
   });

   collector.on('collect', async (i) => {
      if (i.customId === 'return_to_overview') {
         await showCommandOverview(i, localCommands, embedColor);
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
   embedColor
) {
   const categoryCommands = localCommands.filter(
      (cmd) => (cmd.category || 'Uncategorized') === category
   );
   const pages = createCommandPages(categoryCommands, category, embedColor);

   let currentPage = 0;

   const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setCustomId('prev_page')
         .setLabel('Previous')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(true),
      new ButtonBuilder()
         .setCustomId('next_page')
         .setLabel('Next')
         .setStyle(ButtonStyle.Primary)
         .setDisabled(pages.length <= 1),
      new ButtonBuilder()
         .setCustomId('return_to_overview')
         .setLabel('Return to Overview')
         .setStyle(ButtonStyle.Secondary)
   );

   const message = await interaction.reply({
      embeds: [pages[currentPage]],
      components: [row],
   });

   const collector = message.createMessageComponentCollector({
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

      if (i.customId === 'prev_page') {
         currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === 'next_page') {
         currentPage = Math.min(pages.length - 1, currentPage + 1);
      } else if (i.customId === 'return_to_overview') {
         await showCommandOverview(i, localCommands, embedColor);
         return;
      }

      row.components[0].setDisabled(currentPage === 0);
      row.components[1].setDisabled(currentPage === pages.length - 1);

      await i.update({ embeds: [pages[currentPage]], components: [row] });
   });

   collector.on('end', () => {
      row.components.forEach((component) => component.setDisabled(true));
      interaction.editReply({ components: [row] });
   });
}

async function showCommandOverview(interaction, localCommands, embedColor) {
   const categorizedCommands = categorizeCommands(localCommands);
   const categories = Object.keys(categorizedCommands);

   const overviewEmbed = createOverviewEmbed(categorizedCommands, embedColor);

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

   const message = await interaction.reply({
      embeds: [overviewEmbed],
      components: [categorySelect],
   });

   const collector = message.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: INTERACTION_TIMEOUT,
   });

   collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) {
         return i.reply({
            content: "You can't use this menu.",
            ephemeral: true,
         });
      }

      if (i.customId === 'category_select') {
         const selectedCategory = i.values[0];
         await showCategoryCommands(
            i,
            localCommands,
            selectedCategory,
            embedColor
         );
      }
   });

   collector.on('end', () => {
      categorySelect.components[0].setDisabled(true);
      interaction.editReply({ components: [categorySelect] });
   });
}

function createOverviewEmbed(categorizedCommands, embedColor) {
   const embed = new EmbedBuilder()
      .setTitle('📚 Command Overview')
      .setColor(embedColor)
      .setDescription(
         "Here's an overview of all command categories. Select a category from the dropdown menu to view detailed information."
      );

   Object.entries(categorizedCommands).forEach(([category, commands]) => {
      embed.addFields({
         name: `${getCategoryEmoji(category)} ${category}`,
         value: `${commands.length} command${commands.length !== 1 ? 's' : ''}`,
         inline: true,
      });
   });

   return embed;
}

function createCommandPages(commands, category, embedColor) {
   const pages = [];
   for (let i = 0; i < commands.length; i += COMMANDS_PER_PAGE) {
      const pageCommands = commands.slice(i, i + COMMANDS_PER_PAGE);
      const embed = new EmbedBuilder()
         .setTitle(`${getCategoryEmoji(category)} ${category} Commands`)
         .setColor(embedColor)
         .setFooter({
            text: `Page ${pages.length + 1}/${Math.ceil(commands.length / COMMANDS_PER_PAGE)}`,
         });

      const description = pageCommands
         .map((cmd) => {
            const usage = cmd.usage ? ` - Usage: \`${cmd.usage}\`` : '';
            return `• **${cmd.data.name}**: ${cmd.data.description}${usage}`;
         })
         .join('\n');

      embed.setDescription(description.substring(0, MAX_FIELD_LENGTH));
      pages.push(embed);
   }
   return pages;
}

function getCategoryEmoji(category) {
   const emojiMap = {
      Uncategorized: '📁',
      ticket: '🎟️',
      Admin: '🛡️',
      Misc: '🎉',
      image: '🔧',
      economy: '💰',
      Music: '🎵',
      Developer: '👩🏾‍💻',
      Moderation: '🚨',
      Fun: '🎮',
      Utility: '🛠️',
      Information: 'ℹ️',
      Configuration: '⚙️',
   };
   return emojiMap[category] || '📁';
}
