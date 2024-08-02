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
               { name: 'Year', value: 'year' }
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
   cooldown: 19,
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
               .setStyle(ButtonStyle.Primary)
         );

         await interaction.editReply({ embeds: [embed], components: [row] });

         const filter = (i) =>
            i.customId === 'regenerate_fact' &&
            i.user.id === interaction.user.id;

         const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 60000,
         });

         collector.on('collect', async (i) => {
            if (i.customId === 'regenerate_fact') {
               const newFact = await getFact(category);
               const newEmbed = createFactEmbed(newFact, category);
               await i.update({ embeds: [newEmbed], components: [row] });
            }
         });

         collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
               new ButtonBuilder()
                  .setCustomId('regenerate_fact')
                  .setLabel('Get New Fact')
                  .setStyle(ButtonStyle.Primary)
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
   let url = 'https://uselessfacts.jsph.pl/random.json?language=en';

   if (category === 'today') {
      url = 'https://uselessfacts.jsph.pl/today.json?language=en';
   } else if (category === 'year') {
      const currentYear = new Date().getFullYear();
      url = `https://numbersapi.com/${currentYear}/year`;
   }

   const response = await axios.get(url);
   return category === 'year' ? response.data : response.data.text;
}

function createFactEmbed(fact, category) {
   return new EmbedBuilder()
      .setColor(mConfig.embedColorSuccess)
      .setTitle(`${category.charAt(0).toUpperCase() + category.slice(1)} Fact`)
      .setDescription(fact)
      .setFooter({ text: 'Click the button to get a new fact' })
      .setTimestamp();
}
