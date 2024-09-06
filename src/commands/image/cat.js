/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import axios from 'axios';
import { config } from '../../config/config.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('cat')
      .setDescription('send random cat img')

      .setContexts([0, 1, 2])
      .setIntegrationTypes([0, 1])
      .toJSON(),
   category: 'Image',
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   prefix: true,

   userPermissionsBitField: [],
   bot: [],
   run: async (client, interaction) => {
      try {
         const res = await axios.get(
            'https://api.thecatapi.com/v1/images/search'
         );
         const imgurl = res.data[0]?.url;
         if (!imgurl) {
            throw new Error('Failed to get Cat Img .');
         }
         const rembed = new EmbedBuilder()
            .setColor(mconfig.embedColorSuccess)
            .setDescription('Random cat img 😺')
            .setImage(imgurl);

         await interaction.reply({ embeds: [rembed] });
      } catch (error) {
         console.error('err while gitting cat img ', error);
      }
   },
};
