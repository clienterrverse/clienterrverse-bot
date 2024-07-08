import { config } from '../../config/config.js';
import {
   EmbedBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';

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
      .setTitle(`${EMOJIS.LOG} Message Logged`)
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

const createActionRow = (messageId) => {
   return new ActionRowBuilder().addComponents(
      new ButtonBuilder()
         .setCustomId(`delete_${messageId}`)
         .setLabel('Delete')
         .setStyle(ButtonStyle.Danger)
         .setEmoji(EMOJIS.DELETE),
      new ButtonBuilder()
         .setCustomId(`edit_${messageId}`)
         .setLabel('Edit')
         .setStyle(ButtonStyle.Primary)
         .setEmoji(EMOJIS.EDIT)
   );
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
      const actionRow = createActionRow(message.id);

      const logMessage = await logChannel.send({
         embeds: [embed],
         components: [actionRow],
      });

      // Add reactions to the logged message
      await logMessage.react(EMOJIS.REACTION);
      if (imageURL) await logMessage.react(EMOJIS.IMAGE);

      // Set up a reaction collector
      const filter = (reaction, user) => {
         return (
            [EMOJIS.REACTION, EMOJIS.IMAGE, EMOJIS.DELETE].includes(
               reaction.emoji.name
            ) && !user.bot
         );
      };

      const collector = logMessage.createReactionCollector({
         filter,
         time: 600000,
      }); // 10 minutes

      collector.on('collect', async (reaction, user) => {
         if (
            reaction.emoji.name === EMOJIS.DELETE &&
            user.id === message.author.id
         ) {
            await logMessage.delete();
            collector.stop();
         }
      });

      // Set up a button interaction collector
      const buttonCollector = logMessage.createMessageComponentCollector({
         time: 600000,
      }); // 10 minutes

      buttonCollector.on('collect', async (interaction) => {
         if (
            interaction.customId === `delete_${message.id}` &&
            interaction.user.id === message.author.id
         ) {
            await logMessage.delete();
            buttonCollector.stop();
         } else if (
            interaction.customId === `edit_${message.id}` &&
            interaction.user.id === message.author.id
         ) {
            // Implement edit functionality here
            await interaction.reply({
               content: 'Edit functionality not implemented yet.',
               ephemeral: true,
            });
         }
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
