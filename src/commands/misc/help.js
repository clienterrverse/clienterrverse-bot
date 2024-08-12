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

const COMMANDS_PER_PAGE = 8;
const INTERACTION_TIMEOUT = 300000;

const categorizeCommands = (commands) => {
   const categorized = commands.reduce((acc, cmd) => {
      const category = cmd.category || 'Uncategorized';
      if (!acc[category]) acc[category] = [];
      acc[category].push(cmd);
      return acc;
   }, {});

   // Add a separate category for prefix commands
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
            const command = localCommands.find(
               (cmd) => cmd.name.toLowerCase() === commandOption.toLowerCase()
            );
            if (command) {
               return await showCommandDetails(
                  interaction,
                  command,
                  embedColor,
                  prefix
               );
            } else {
               return await interaction.reply({
                  content: `Command "${commandOption}" not found.`,
                  ephemeral: true,
               });
            }
         }

         if (categoryOption) {
            const categorizedCommands = categorizeCommands(localCommands);
            const category = Object.keys(categorizedCommands).find(
               (cat) => cat.toLowerCase() === categoryOption.toLowerCase()
            );
            if (category) {
               return await showCategoryCommands(
                  interaction,
                  localCommands,
                  category,
                  embedColor,
                  prefix
               );
            } else {
               return await interaction.reply({
                  content: `Category "${categoryOption}" not found.`,
                  ephemeral: true,
               });
            }
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

async function showCommandDetails(interaction, command, embedColor, prefix) {
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
         {
            name: '⏳ Cooldown',
            value: `${command.cooldown ?? 0}s`,
            inline: true,
         },
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
      ephemeral: true,
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
         const localCommands = await getLocalCommands();
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
   const categoryCommands = categorizedCommands[category] ?? [];

   if (categoryCommands.length === 0) {
      return interaction.reply({
         content: `No commands found in the "${category}" category.`,
         ephemeral: true,
      });
   }

   const pages = createCommandPages(
      categoryCommands,
      category,
      embedColor,
      prefix
   );

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

   const response = await interaction.reply({
      embeds: [pages[currentPage]],
      components: [row],
      ephemeral: true,
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

      if (i.customId === 'prev_page') {
         currentPage = Math.max(0, currentPage - 1);
      } else if (i.customId === 'next_page') {
         currentPage = Math.min(pages.length - 1, currentPage + 1);
      } else if (i.customId === 'return_to_overview') {
         await showCommandOverview(i, localCommands, embedColor, prefix);
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
      ephemeral: true,
   });

   const collector = response.createMessageComponentCollector({
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
            embedColor,
            prefix
         );
      }
   });

   collector.on('end', () => {
      categorySelect.components[0].setDisabled(true);
      interaction.editReply({ components: [categorySelect] });
   });
}

function createOverviewEmbed(categorizedCommands, embedColor, prefix) {
   const embed = new EmbedBuilder()
      .setTitle('📚 Command Overview')
      .setColor(embedColor)
      .setDescription(
         `Here's an overview of all available categories. Select a category from the dropdown below to view the commands.\n\n**Prefix:** \`${prefix}\``
      );

   Object.keys(categorizedCommands).forEach((category) => {
      embed.addFields({
         name: getCategoryEmoji(category) + ' ' + category,
         value: categorizedCommands[category]
            .map((cmd) => `\`${cmd.name}\``)
            .join(', '),
         inline: true,
      });
   });

   return embed;
}

function createCommandPages(commands, category, embedColor, prefix) {
   const pages = [];
   const totalPages = Math.ceil(commands.length / COMMANDS_PER_PAGE);

   for (let i = 0; i < totalPages; i++) {
      const pageCommands = commands.slice(
         i * COMMANDS_PER_PAGE,
         i * COMMANDS_PER_PAGE + COMMANDS_PER_PAGE
      );

      const embed = new EmbedBuilder()
         .setTitle(`📖 ${category} Commands`)
         .setColor(embedColor)
         .setDescription(`Page ${i + 1} of ${totalPages}`)
         .addFields(
            pageCommands.map((cmd) => ({
               name: cmd.name,
               value: cmd.description || 'No description available.',
               inline: true,
            }))
         );

      pages.push(embed);
   }

   return pages;
}

function getCategoryEmoji(category) {
   const emojis = {
      Uncategorized: '❓',
      'Prefix Commands': '🔧',
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

      // Add more category-specific emojis if desired
   };
   return emojis[category] || '📁';
}
