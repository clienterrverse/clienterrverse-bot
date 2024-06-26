/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

import axios from 'axios';
import mconfig from '../../config/messageConfig.json' assert { type: 'json' };

export default {
  data: new SlashCommandBuilder()
    .setName("cat")
    .setDescription("send random cat img")

    .toJSON(),
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  userPermissionsBitField: [],
  bot: [],
  run: async (client, interaction) => {
    try {
      const res = await axios.get("https://api.thecatapi.com/v1/images/search");
      const imgurl = res.data[0]?.url;
      if (!imgurl) {
        throw new Error("Failed to get Cat Img .");
      }
      const rembed = new EmbedBuilder()
        .setColor(mconfig.embedColorSuccess)
        .setDescription("Random cat img 😺")
        .setImage(imgurl);

      await interaction.reply({ embeds: [rembed] });
    } catch (error) {
      console.error("err while gitting cat img ", error);
    }
  },
};