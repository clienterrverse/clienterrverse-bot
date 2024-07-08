import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import pagination from '../../utils/buttonPagination.js';

export default {
   data: new SlashCommandBuilder()
      .setName('commandname')
      .setDescription('Brief description of what the command does')
      .toJSON(),
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   cooldown: 5,
   userPermissionsBitField: [],
   bot: [],
   run: async (client, interaction) => {
      try {
         const pages = [
            new EmbedBuilder().setDescription('Page 1').setColor('#FF0000'),
            new EmbedBuilder().setDescription('Page 2').setColor('#00FF00'),
            new EmbedBuilder().setDescription('Page 3').setColor('#0000FF'),
         ];

         await pagination(interaction, pages);
      } catch (error) {
         console.error('Error in command: ', error);
      }
   },
   autocomplete: async (client, interaction) => {
      // Autocomplete logic goes here
   },
};
