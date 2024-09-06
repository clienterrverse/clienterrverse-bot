/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
   data: new SlashCommandBuilder()
      .setName('rainbow')
      .setDescription("Applies a rainbow filter to a user's avatar")
      .addUserOption((option) =>
         option
            .setName('user')
            .setDescription(
               'User whose avatar you want to apply the filter to:'
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
            forceStatic: true, // Ensures a static image (not animated)
            size: 1024, // High resolution
         });

         // Generate the image with the rainbow effect
         const img = await new DIG.Gay().getImage(avatarUrl);

         // Create an attachment using AttachmentBuilder
         const attachment = new AttachmentBuilder(img).setName('rainbow.png');

         // Send the image as a reply
         await interaction.editReply({ files: [attachment] });
      } catch (error) {
         console.error('Error while applying rainbow effect:', error);
         await interaction.editReply({
            content: 'Sorry, something went wrong while generating the image.',
         });
      }
   },
};
