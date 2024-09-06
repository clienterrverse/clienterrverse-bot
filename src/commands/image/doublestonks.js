/** @format */

import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import DIG from 'discord-image-generation';

export default {
   data: new SlashCommandBuilder()
      .setName('doublestonks')
      .setDescription(
         "Applies a 'Double Stonks' effect using two users' avatars"
      )
      .addUserOption((option) =>
         option
            .setName('user1')
            .setDescription('First user whose avatar you want to use')
            .setRequired(true)
      )
      .addUserOption((option) =>
         option
            .setName('user2')
            .setDescription('Second user whose avatar you want to use')
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

         const user1 = interaction.options.getUser('user1');
         const user2 = interaction.options.getUser('user2');
         const avatarUrl1 = user1.displayAvatarURL({
            extension: 'png',
            forceStatic: true,
            size: 512,
         });
         const avatarUrl2 = user2.displayAvatarURL({
            extension: 'png',
            forceStatic: true,
            size: 512,
         });

         // Generate the Double Stonks image
         const img = await new DIG.DoubleStonk().getImage(
            avatarUrl1,
            avatarUrl2
         );

         // Create an attachment using AttachmentBuilder
         const attachment = new AttachmentBuilder(img).setName(
            'doublestonks.png'
         );

         // Send the image as a reply
         await interaction.editReply({ files: [attachment] });
      } catch (error) {
         console.error('Error while generating Double Stonks image:', error);
         await interaction.editReply({
            content: 'Sorry, something went wrong while generating the image.',
         });
      }
   },
};
