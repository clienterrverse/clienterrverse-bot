import { config } from '../../config/config.js';
import { EmbedBuilder } from 'discord.js';

const EMOJIS = {
   LOG: '📝',
   ERROR: '❌',
   IMAGE: '🖼️',
   REACTION: '👍',
   DELETE: '🗑️',
   EDIT: '✏️',
};

const createMessageEmbed = (message, author, content, time, imageURL) => {
   return new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`${EMOJIS.LOG} Message Log`)
      .setThumbnail(author.displayAvatarURL())
      .addFields(
         {
            name: `${EMOJIS.REACTION} Author`,
            value: `${author.tag} (ID: ${author.id})`,
            inline: true,
         },
         {
            name: '💬 Channel',
            value: `${message.channel.name} (ID: ${message.channel.id})`,
            inline: true,
         },
         { name: '📄 Content', value: content },
         { name: '🕒 Time', value: time, inline: true },
         { name: '🔢 Message ID', value: message.id, inline: true },
         { name: '🏠 Server', value: message.guild.name, inline: true }
      )
      .setFooter({
         text: `Message Logger | ${message.client.user.tag}`,
         iconURL: message.client.user.displayAvatarURL(),
      })
      .setTimestamp()
      .setImage(imageURL);
};

const createErrorEmbed = (error, client) => {
   return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.ERROR} Error Logging Message`)
      .setDescription(
         `An error occurred while attempting to log a message: ${error.message}`
      )
      .setFooter({
         text: `Message Logger | ${client.user.tag}`,
         iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();
};

const getImageURL = (message) => {
   const attachment = message.attachments.first();
   if (
      attachment &&
      attachment.contentType &&
      attachment.contentType.startsWith('image/')
   ) {
      return attachment.url;
   }
   return null;
};

export default async (client, errorHandler, message) => {
   if (message.author.bot || message.guild.id !== config.testServerId) return;

   const logChannel = client.channels.cache.get(config.logChannel);
   if (!logChannel) {
      console.error(`Log channel with ID ${config.logChannel} not found.`);
      return;
   }

   try {
      const author = message.author;
      const content = message.content || '*Message content not available*';
      const time = message.createdAt.toLocaleString();
      const imageURL = getImageURL(message);

      const embed = createMessageEmbed(
         message,
         author,
         content,
         time,
         imageURL
      );

      const logMessage = await logChannel.send({
         embeds: [embed],
      });
   } catch (error) {
      console.error('Error logging message:', error);

      try {
         const errorEmbed = createErrorEmbed(error, client);
         await logChannel.send({ embeds: [errorEmbed] });
      } catch (innerError) {
         console.error('Error logging the error:', innerError);
      }
   }
};
