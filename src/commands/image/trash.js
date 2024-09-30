/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
  data: new SlashCommandBuilder()
    .setName('trash')
    .setDescription("Applies a 'Trash' effect to a user's avatar")
    .addUserOption((option) =>
      option
        .setName('user')
        .setDescription(
          "User whose avatar you want to apply the 'Trash' effect to"
        )
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
      const avatarUrl = user.displayAvatarURL({
        extension: 'png',
        forceStatic: true,
        size: 1024,
      });

      // Generate the "Trash" effect image
      const img = await new DIG.Trash().getImage(avatarUrl);

      // Create an attachment using AttachmentBuilder
      const attachment = new AttachmentBuilder(img).setName('trash.png');

      // Send the image as a reply
      await interaction.editReply({ files: [attachment] });
    } catch (error) {
      console.error('Error while applying Trash effect:', error);
      await interaction.editReply({
        content: 'Sorry, something went wrong while generating the image.',
      });
    }
  },
};
