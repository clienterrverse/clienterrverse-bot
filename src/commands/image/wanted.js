/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
  data: new SlashCommandBuilder()
    .setName('wanted')
    .setDescription("Creates a 'Wanted' poster with a user's avatar")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription('User whose avatar you want on the Wanted poster')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('currency')
        .setDescription('Currency symbol to use for the reward (e.g., $, €, ¥)')
        .setRequired(false)
    )
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
      await interaction.deferReply();

      const user = interaction.options.getUser('user') || interaction.user;
      const currency = interaction.options.getString('currency') || '$';
      const avatarUrl = user.displayAvatarURL({
        extension: 'png',
        forceStatic: true,
        size: 1024,
      });

      // Generate the "Wanted" poster image
      const img = await new DIG.Wanted().getImage(avatarUrl, currency);

      // Create an attachment using AttachmentBuilder
      const attachment = new AttachmentBuilder(img).setName('wanted.png');

      // Send the image as a reply
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error while creating Wanted poster:', error);
      await interaction.editReply({
        content: 'Sorry, something went wrong while generating the image.',
      });
    }
  },
};
