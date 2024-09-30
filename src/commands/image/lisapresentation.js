/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
  data: new SlashCommandBuilder()
    .setName('lisapresentation')
    .setDescription('Generates an image of Lisa presenting your custom text')
    .addStringOption((option) =>
      option
        .setName('text')
        .setDescription('The text you want Lisa to present')
        .setRequired(true)
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

      const text = interaction.options.getString('text');

      // Generate the Lisa Presentation image
      const img = await new DIG.LisaPresentation().getImage(text);

      // Create an attachment using AttachmentBuilder
      const attachment = new AttachmentBuilder(img).setName(
        'lisapresentation.png'
      );

      // Send the image as a reply
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error while generating Lisa Presentation image:', error);
      await interaction.editReply({
        content: 'Sorry, something went wrong while generating the image.',
      });
    }
  },
};
