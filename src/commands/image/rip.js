/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
   data: new SlashCommandBuilder()
      .setName('rip')
      .setDescription("Creates a RIP tombstone with a user's avatar")
      .addUserOption((option) =>
         option
            .setName('user')
            .setDescription('User whose avatar you want on the tombstone')
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
            size: 512, // Medium resolution to fit the tombstone
         });

         // Generate the RIP tombstone image
         const img = await new DIG.Rip().getImage(avatarUrl);

         // Create an attachment using AttachmentBuilder
         const attachment = new AttachmentBuilder(img).setName('rip.png');

         // Send the image as a reply
         await interaction.editReply({ files: [attachment] });
      } catch (error) {
         console.error('Error while generating RIP image:', error);
         await interaction.editReply({
            content: 'Sorry, something went wrong while generating the image.',
         });
      }
   },
};
