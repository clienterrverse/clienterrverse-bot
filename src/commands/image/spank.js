/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
   data: new SlashCommandBuilder()
      .setName('spank')
      .setDescription('Spank another user with this command!')
      .addUserOption((option) =>
         option
            .setName('target')
            .setDescription('User you want to spank')
            .setRequired(true)
      )
      .addUserOption((option) =>
         option
            .setName('initiator')
            .setDescription('User who initiates the spanking (defaults to you)')
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

         // Get the users
         const targetUser = interaction.options.getUser('target');
         const initiatorUser =
            interaction.options.getUser('initiator') || interaction.user;

         // Get their avatars
         const targetAvatarUrl = targetUser.displayAvatarURL({
            extension: 'png',
            forceStatic: true,
            size: 512,
         });
         const initiatorAvatarUrl = initiatorUser.displayAvatarURL({
            extension: 'png',
            forceStatic: true,
            size: 512,
         });

         // Generate the spank image
         const img = await new DIG.Spank().getImage(
            initiatorAvatarUrl,
            targetAvatarUrl
         );

         // Create an attachment using AttachmentBuilder
         const attachment = new AttachmentBuilder(img).setName('spank.png');

         // Send the image as a reply
         await interaction.editReply({ files: [attachment] });
      } catch (error) {
         console.error('Error while generating spank image:', error);
         await interaction.editReply({
            content: 'Sorry, something went wrong while generating the image.',
         });
      }
   },
};
