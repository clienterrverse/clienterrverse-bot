import {
   SlashCommandBuilder,
   EmbedBuilder,
   AutocompleteInteraction,
   ActionRowBuilder,
   StringSelectMenuBuilder,
} from 'discord.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import mConfig from '../../config/messageConfig.js';
import paginate from '../../utils/buttonPagination.js';

const MAX_DESCRIPTION_LENGTH = 2048;
const COMMANDS_PER_PAGE = 10; // Adjust as necessary
const MAX_FIELD_LENGTH = 1024;

// Function to split text into chunks of a specified length
const splitText = (text, length) => {
   return text.match(new RegExp(`.{1,${length}}`, 'g')) || [];
};

// Function to categorize commands
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

   async autocomplete(client, interaction) {
      const focusedOption = interaction.options.getFocused(true);
      const localCommands = await getLocalCommands();

      if (focusedOption.name === 'command') {
         const filtered = localCommands.filter((cmd) =>
            cmd.data.name.startsWith(focusedOption.value)
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
            const categoryCommands = localCommands.filter(
               (cmd) => (cmd.category || 'Uncategorized') === category
            );
            const commandsText = categoryCommands
               .map(
                  (cmd) =>
                     `\`${cmd.data.name}\`: ${cmd.data.description || 'No description available.'}`
               )
               .join('\n');

            const textChunks = splitText(commandsText, MAX_DESCRIPTION_LENGTH);
            const pages = textChunks.map((chunk, index) =>
               new EmbedBuilder()
                  .setTitle(`Commands in ${category}`)
                  .setDescription(chunk)
                  .setColor(embedColor)
                  .setFooter({
                     text: `Page ${index + 1} of ${textChunks.length}`,
                  })
            );

            return paginate(interaction, pages);
         } else {
            return await showCommandList(
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
   const command = localCommands.find((cmd) => cmd.data.name === commandName);
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
               `• **${opt.name}**: ${opt.description} ${opt.required ? '*(Required)*' : ''}`
         )
         .join('\n');
      embed.addFields({
         name: '🔧 Options',
         value: optionsText,
         inline: false,
      });
   }

   return interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showCommandList(interaction, localCommands, embedColor) {
   const categories = [
      ...new Set(localCommands.map((cmd) => cmd.category || 'Uncategorized')),
   ];

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

   const initialEmbed = new EmbedBuilder()
      .setTitle('📚 Command Categories')
      .setDescription(
         'Select a category from the dropdown menu below to view its commands.'
      )
      .setColor(embedColor);

   const message = await interaction.reply({
      embeds: [initialEmbed],
      components: [categorySelect],
      ephemeral: true,
   });

   const collector = message.createMessageComponentCollector({ time: 300000 }); // 5 minutes

   collector.on('collect', async (i) => {
      if (i.customId === 'category_select') {
         const selectedCategory = i.values[0];
         const categoryCommands = localCommands.filter(
            (cmd) => (cmd.category || 'Uncategorized') === selectedCategory
         );
         const pages = createCommandPages(
            categoryCommands,
            selectedCategory,
            embedColor
         );
         await paginate(i, pages);
      }
   });

   collector.on('end', () => {
      interaction.editReply({ components: [] });
   });
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
   // Add more emojis for different categories
   const emojiMap = {
      Uncategorized: '📁',
      ticket: '🛡️',
      Misc: '🎉',
      image: '🔧',
      economy: '💰',
      Music: '🎵',
   };
   return emojiMap[category] || '📁';
}
