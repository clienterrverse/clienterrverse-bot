import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
   .setName('emoji-app')
   .setDescription('Manage app emojis')
   .addSubcommand((command) =>
      command
         .setName('create')
         .setDescription('Create an app emoji')
         .addAttachmentOption((option) =>
            option
               .setName('emoji')
               .setDescription('The emoji to add')
               .setRequired(true)
         )
         .addStringOption((option) =>
            option
               .setName('name')
               .setDescription('The name of the emoji')
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

         const sendMessage = async (message) => {
            const embed = new EmbedBuilder()
               .setColor('Random')
               .setDescription(message);
            await interaction.reply({ embeds: [embed], ephemeral: true });
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
                  const createResponse = await axios.post(
                     `https://discord.com/api/v10/applications/${applicationId}/emojis`,
                     data,
                     config
                  );
                  output = createResponse.data;
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
               const emoji = options.getAttachment('emoji');
               const name = options.getString('name');

               const response = await axios.get(emoji.url, {
                  responseType: 'arraybuffer',
               });
               const buffer = Buffer.from(response.data, 'binary');
               const base64Image = buffer.toString('base64');

               const createData = {
                  name,
                  image: `data:image/png;base64,${base64Image}`,
               };

               const createOutput = await apiCall('create', createData);
               if (!createOutput) {
                  await sendMessage(
                     'There was an issue creating the emoji. Please check the provided data.'
                  );
               } else {
                  await sendMessage(
                     `<:${createOutput.name}:${createOutput.id}> I have created the emoji. Use \`<:${createOutput.name}:${createOutput.id}>\` in your messages.`
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
               const emojis = await apiCall('list');
               responseMessage = 'List of all emojis:\n';
               emojis.forEach((emoji) => {
                  responseMessage += `<:${emoji.name}:${emoji.id}> \`${emoji.name}\` (ID: ${emoji.id})\n`;
               });
               await sendMessage(responseMessage);
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
