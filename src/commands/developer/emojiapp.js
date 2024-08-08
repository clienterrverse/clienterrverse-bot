import axios from 'axios';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const data = new SlashCommandBuilder()
   .setName('emoji-app')
   .setDescription('Manage application emojis')
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
      command
         .setName('edit')
         .setDescription('Edit an app emoji name')
         .addStringOption((option) =>
            option
               .setName('emoji-id')
               .setDescription('The ID of the emoji to edit')
               .setRequired(true)
         )
         .addStringOption((option) =>
            option
               .setName('new-name')
               .setDescription('The new name for the emoji')
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
      await interaction.deferReply();
      const { options } = interaction;
      const subCommand = options.getSubcommand();

      const emojiManager = new EmojiManager(
         process.env.APPLICATION_ID,
         process.env.TOKEN
      );

      try {
         switch (subCommand) {
            case 'create':
               await handleCreateCommand(emojiManager, options, interaction);
               break;
            case 'remove':
               await handleRemoveCommand(emojiManager, options, interaction);
               break;
            case 'edit':
               await handleEditCommand(emojiManager, options, interaction);
               break;
            case 'list':
               await handleListCommand(emojiManager, interaction);
               break;
            default:
               throw new Error('Invalid subcommand');
         }
      } catch (error) {
         console.error('Command execution error:', error);
         await sendErrorMessage(
            interaction,
            'An error occurred while processing the command. Please try again later.'
         );
      }
   },
};

class EmojiManager {
   constructor(applicationId, token) {
      this.applicationId = applicationId;
      this.token = token;
      this.baseUrl = `https://discord.com/api/v10/applications/${this.applicationId}/emojis`;
   }

   async apiCall(method, endpoint = '', data = null) {
      const config = {
         method,
         url: `${this.baseUrl}${endpoint}`,
         headers: { Authorization: `Bot ${this.token}` },
         data,
      };

      try {
         const response = await axios(config);
         return response.data;
      } catch (error) {
         console.error(
            `API Call Error - ${method} ${endpoint}:`,
            error.response?.data || error.message
         );
         throw error;
      }
   }

   async createEmoji(name, image) {
      return this.apiCall('POST', '', { name, image });
   }

   async removeEmoji(emojiId) {
      return this.apiCall('DELETE', `/${emojiId}`);
   }

   async editEmoji(emojiId, name) {
      return this.apiCall('PATCH', `/${emojiId}`, { name });
   }

   async listEmojis() {
      return this.apiCall('GET');
   }
}

async function handleCreateCommand(emojiManager, options, interaction) {
   const emojis = options.getString('emojis').split(' ');
   const names = options
      .getString('names')
      .split(',')
      .map((name) => name.trim());

   if (emojis.length !== names.length) {
      await sendErrorMessage(
         interaction,
         'The number of emojis and names must match.'
      );
      return;
   }

   const createdEmojis = [];

   for (let i = 0; i < emojis.length; i++) {
      try {
         const { imageBuffer, isAnimated } = await getEmojiImage(emojis[i]);
         const base64Image = imageBuffer.toString('base64');
         const createData = {
            name: names[i],
            image: `data:image/${isAnimated ? 'gif' : 'png'};base64,${base64Image}`,
         };

         const createdEmoji = await emojiManager.createEmoji(
            createData.name,
            createData.image
         );
         createdEmojis.push(
            `<${isAnimated ? 'a' : ''}:${createdEmoji.name}:${createdEmoji.id}>`
         );
      } catch (error) {
         console.error(`Error creating emoji ${emojis[i]}:`, error);
         await sendErrorMessage(
            interaction,
            `Failed to create emoji ${emojis[i]}: ${error.message}`
         );
      }
   }

   if (createdEmojis.length > 0) {
      await sendSuccessMessage(
         interaction,
         `Created emojis: ${createdEmojis.join(' ')}`
      );
   } else {
      await sendErrorMessage(
         interaction,
         'No emojis were created. Please check the provided data and try again.'
      );
   }
}

async function handleRemoveCommand(emojiManager, options, interaction) {
   const emojiId = options.getString('emoji-id');
   try {
      await emojiManager.removeEmoji(emojiId);
      await sendSuccessMessage(
         interaction,
         `Removed emoji with ID: ${emojiId}`
      );
   } catch (error) {
      await sendErrorMessage(
         interaction,
         `Failed to remove emoji: ${error.message}`
      );
   }
}

async function handleEditCommand(emojiManager, options, interaction) {
   const emojiId = options.getString('emoji-id');
   const newName = options.getString('new-name');
   try {
      const editedEmoji = await emojiManager.editEmoji(emojiId, newName);
      await sendSuccessMessage(
         interaction,
         `Emoji name updated successfully to: ${editedEmoji.name}`
      );
   } catch (error) {
      await sendErrorMessage(
         interaction,
         `Failed to edit emoji: ${error.message}`
      );
   }
}

async function handleListCommand(emojiManager, interaction) {
   try {
      const { items: emojisList } = await emojiManager.listEmojis();

      if (Array.isArray(emojisList) && emojisList.length > 0) {
         // Format the emoji list message
         const emojiListMessage = emojisList
            .map(
               (emoji) =>
                  `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}> \`${emoji.name}\` (ID: ${emoji.id})`
            )
            .join('\n');

         await sendSuccessMessage(
            interaction,
            `List of all emojis:\n${emojiListMessage}`
         );
      } else {
         await sendInfoMessage(
            interaction,
            'No emojis found for this application.'
         );
      }
   } catch (error) {
      // Send an error message if the emoji list retrieval fails
      await sendErrorMessage(
         interaction,
         `Failed to retrieve emoji list: ${error.message}`
      );
   }
}

async function getEmojiImage(emoji) {
   let imageBuffer;
   let isAnimated = false;

   if (emoji.startsWith('<:') || emoji.startsWith('<a:')) {
      isAnimated = emoji.startsWith('<a:');
      const emojiId = emoji.split(':')[2].slice(0, -1);
      const extension = isAnimated ? 'gif' : 'png';
      const url = `https://cdn.discordapp.com/emojis/${emojiId}.${extension}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
   } else {
      const codePoint = emoji.codePointAt(0).toString(16);
      const url = `https://raw.githubusercontent.com/twitter/twemoji/master/assets/72x72/${codePoint}.png`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      imageBuffer = Buffer.from(response.data, 'binary');
   }

   return { imageBuffer, isAnimated };
}

async function sendErrorMessage(interaction, message) {
   const embed = new EmbedBuilder()
      .setTitle('Error')
      .setDescription(message)
      .setColor('Red');
   await interaction.editReply({ embeds: [embed] });
}

async function sendSuccessMessage(interaction, message) {
   const embed = new EmbedBuilder()
      .setTitle('Success')
      .setDescription(message)
      .setColor('Green');
   await interaction.editReply({ embeds: [embed] });
}

async function sendInfoMessage(interaction, message) {
   const embed = new EmbedBuilder()
      .setTitle('Info')
      .setDescription(message)
      .setColor('Red');
   await interaction.editReply({ embeds: [embed] });
}
