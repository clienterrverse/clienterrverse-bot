/** @format */

import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName("test")
    .setDescription("Test if everything works.")
    .addStringOption((o) =>
      o.setName("test-option").setDescription("This is a test option.")
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5, 
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: (client, interaction) => {},
};