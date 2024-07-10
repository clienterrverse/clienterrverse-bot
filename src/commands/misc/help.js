import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import getLocalCommands from '../../utils/getLocalCommands.js';
import mConfig from '../../config/messageConfig.js';
import paginate from '../../utils/buttonPagination.js';

const MAX_DESCRIPTION_LENGTH = 2048; // Max length of a single field in an embed

// Function to split text into chunks of a specified length
const splitText = (text, length) => {
   const result = [];
   for (let i = 0; i < text.length; i += length) {
      result.push(text.slice(i, i + length));
   }
   return result;
};

export default {
   data: new SlashCommandBuilder()
      .setName('help')
      .setDescription(
         'Displays a list of available commands or info about a specific command'
      )
      .addStringOption((option) =>
         option
            .setName('command')
            .setDescription('Specific command to get info about')
            .setRequired(false)
      )
      .toJSON(),

   userPermissions: [],
   botPermissions: [],
   cooldown: 10,
   nsfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      try {
         const localCommands = await getLocalCommands();
         const commandName = interaction.options.getString('command');
         const embedColor = mConfig.embedColorDefault || '#0099ff'; // Default fallback color

         if (commandName) {
            // Provide detailed info about a specific command
            const command = localCommands.find(
               (cmd) => cmd.data.name === commandName
            );
            if (!command) {
               return interaction.reply({
                  content: 'Command not found.',
                  ephemeral: true,
               });
            }

            const embed = new EmbedBuilder()
               .setTitle(`Command: ${command.data.name}`)
               .setDescription(
                  command.data.description || 'No description available.'
               )
               .setColor(embedColor);

            if (command.data.options) {
               command.data.options.forEach((option) => {
                  embed.addFields({
                     name: option.name,
                     value: option.description,
                     inline: true,
                  });
               });
            }

            return interaction.reply({ embeds: [embed] });
         } else {
            // Provide a list of all commands
            const commandsText = localCommands
               .map(
                  (cmd) =>
                     `\`${cmd.data.name}\`: ${cmd.data.description || 'No description available.'}`
               )
               .join('\n');

            // Split the commandsText into chunks to fit within embed length limits
            const textChunks = splitText(commandsText, MAX_DESCRIPTION_LENGTH);

            // Create an array of embeds
            const pages = textChunks.map((chunk, index) =>
               new EmbedBuilder()
                  .setTitle('Available Commands')
                  .setDescription(chunk)
                  .setColor(embedColor)
                  .setFooter({
                     text: `Page ${index + 1} of ${textChunks.length}`,
                  })
            );

            // Use the pagination utility
            return paginate(interaction, pages);
         }
      } catch (error) {
         return interaction.reply({
            content: 'An error occurred while fetching help information.',
            ephemeral: true,
         });
         throw error;
      }
   },
};
