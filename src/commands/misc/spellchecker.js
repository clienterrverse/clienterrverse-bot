/** @format */

import { SlashCommandBuilder } from 'discord.js';
import Spellchecker from 'spellchecker';

export default {
  data: new SlashCommandBuilder()
    .setName("spellcheck")
    .setDescription("Check for spelling and grammar errors.")
    .addStringOption((option) =>
      option.setName("word")
        .setDescription("Word or sentence to spell check.")
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    const wordToCheck = interaction.options.getString("word");
    const isSpelledCorrectly = Spellchecker.isMisspelled(wordToCheck);

    if (isSpelledCorrectly) {
      await interaction.reply(`No spelling or grammar errors found in "${wordToCheck}".`);
    } else {
      await interaction.reply(`Spelling or grammar errors found in "${wordToCheck}".`);
    }
  },
};

