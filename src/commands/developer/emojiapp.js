import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { createCanvas, loadImage } from 'canvas';

const data = new SlashCommandBuilder()
   .setName('emoji-app')
   .setDescription('Manage app emojis')
   .addSubcommand((command) =>
      command
         .setName('create')
         .setDescription('Create app emojis')
         .addStringOption((option) =>
            option
               .setName('emojis')
               .setDescription('The emojis to add (space-separated)')
               .setRequired(true)
         )
         .addStringOption((option) =>
            option
               .setName('names')
               .setDescription('The names of the emojis (comma-separated)')
               .setRequired(true)
         )
   )
   .addSubcommand((command) =>
      command
         .setName('remove')
         .setDescription('Remove an app emoji')
         .addStringOption((option) =>
            option
               .setName('emoji-id')
               .setDescription('The ID of the emoji to remove')
               .setRequired(true)
         )
   )
   .addSubcommand((command) =>
      command.setName('list').setDescription('List all app emojis')
   )
   .toJSON();

export default {
   data,
   userPermissions: [],
   botPermissions: [],
   category: 'Misc',
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   prefix: false,

   run: async (client, interaction) => {
      try {
         const { options } = interaction;
         const subCommand = options.getSubcommand();
         const applicationId = process.env.APPLICATION_ID;
         const token = process.env.TOKEN;
         await interaction.deferReply();

         const sendMessage = async (message) => {
            const embed = new EmbedBuilder()
               .setColor('Random')
               .setDescription(message);
            await interaction.editReply({ embeds: [embed] });
         };

         const convertEmojiToImage = async (emoji) => {
            const canvas = createCanvas(128, 128);
            const ctx = canvas.getContext('2d');
            const image = await loadImage(
               `https://github.com/twitter/twemoji/raw/master/assets/72x72/${emoji.codePointAt(0).toString(16)}.png`
            );
            ctx.drawImage(image, 0, 0, 128, 128);
            return canvas.toBuffer();
         };

         const convertCustomEmojiToImage = async (emojiId) => {
            const canvas = createCanvas(128, 128);
            const ctx = canvas.getContext('2d');
            const image = await loadImage(
               `https://cdn.discordapp.com/emojis/${emojiId}.png`
            );
            ctx.drawImage(image, 0, 0, 128, 128);
            return canvas.toBuffer();
         };

         const apiCall = async (type, data) => {
            let output;
            const config = {
               headers: {
                  Authorization: `Bot ${token}`,
               },
            };

            switch (type) {
               case 'create':
                  output = await axios.post(
                     `https://discord.com/api/v10/applications/${applicationId}/emojis`,
                     data,
                     config
                  );
                  break;
               case 'remove':
                  await axios.delete(
                     `https://discord.com/api/v10/applications/${applicationId}/emojis/${data['emoji-id']}`,
                     config
                  );
                  output = `Removed emoji with ID: ${data['emoji-id']}`;
                  break;
               case 'list':
                  const listResponse = await axios.get(
                     `https://discord.com/api/v10/applications/${applicationId}/emojis`,
                     config
                  );
                  output = listResponse.data;
                  break;
               default:
                  throw new Error('Unknown command type');
            }
            return output;
         };

         let responseMessage;
         switch (subCommand) {
            case 'create':
               const emojis = options.getString('emojis').split(' ');
               const names = options
                  .getString('names')
                  .split(',')
                  .map((name) => name.trim());

               if (emojis.length !== names.length) {
                  await sendMessage(
                     'The number of emojis and names must match.'
                  );
                  return;
               }

               const createdEmojis = [];

               for (let i = 0; i < emojis.length; i++) {
                  const emoji = emojis[i];
                  const name = names[i];

                  try {
                     let imageBuffer;
                     if (emoji.startsWith('<:') && emoji.endsWith('>')) {
                        const emojiId = emoji.split(':')[2].slice(0, -1);
                        imageBuffer = await convertCustomEmojiToImage(emojiId);
                     } else {
                        imageBuffer = await convertEmojiToImage(emoji);
                     }
                     const base64Image = imageBuffer.toString('base64');

                     const createData = {
                        name,
                        image: `data:image/png;base64,${base64Image}`,
                     };

                     const createOutput = await apiCall('create', createData);
                     if (createOutput) {
                        createdEmojis.push(
                           `<:${createOutput.data.name}:${createOutput.data.id}>`
                        );
                     }
                  } catch (error) {
                     console.error(`Error creating emoji ${emoji}:`, error);
                  }
               }

               if (createdEmojis.length > 0) {
                  await sendMessage(
                     `I have created the following emojis: ${createdEmojis.join(' ')}`
                  );
               } else {
                  await sendMessage(
                     'There was an issue creating the emojis. Please check the provided data.'
                  );
               }
               break;

            case 'remove':
               responseMessage = await apiCall('remove', {
                  'emoji-id': options.getString('emoji-id'),
               });
               await sendMessage(responseMessage);
               break;

            case 'list':
               const emojisList = await apiCall('list');
               console.log('Emojis List Response:', emojisList);

               // Ensure emojisList.items is an array
               if (Array.isArray(emojisList.items)) {
                  let responseMessage = 'List of all emojis:\n';
                  emojisList.items.forEach((emoji) => {
                     responseMessage += `<:${emoji.name}:${emoji.id}> \`${emoji.name}\` (ID: ${emoji.id})\n`;
                  });
                  await sendMessage(responseMessage);
               } else {
                  await sendMessage('Failed to retrieve emoji list.');
               }
               break;
            default:
               throw new Error('Invalid subcommand');
         }
      } catch (error) {
         console.error(error);
         await interaction.editReply(
            'An error occurred while processing the command. Please try again later.'
         );
      }
   },
};
