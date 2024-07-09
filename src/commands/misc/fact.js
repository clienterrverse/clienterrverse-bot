/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import axios from 'axios';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('fact')
      .setDescription('send random fact')
      .toJSON(),

   userPermissionsBitField: [],
   bot: [],
   cooldown: 19, // Cooldown of 5 seconds
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   run: async (client, interaction) => {
      try {
         const res = await axios.get(
            'https://uselessfacts.jsph.pl/random.json?language=en'
         );
         const fact = res.data.text;

         const rembed = new EmbedBuilder()
            .setColor(mConfig.embedColorSuccess)
            .setTitle('fact')
            .setDescription(fact);

         await interaction.reply({ embeds: [rembed] });
      } catch (error) {
         throw error;

      }
   },
};
