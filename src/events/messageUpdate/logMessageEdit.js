import { config } from '../../config/config.js';
import { EmbedBuilder } from 'discord.js';

const EMOJIS = {
   EDIT: '✏️',
   AUTHOR: '👤',
   CHANNEL: '💬',
   TIME: '🕒',
   ID: '🔢',
   SERVER: '🏠',
   OLD: '⬅️',
   NEW: '➡️',
   EMBED: '🖼️',
   ERROR: '❌',
   ATTACHMENT: '📎',
};

const createMessageEmbed = (oldMessage, newMessage, author, time) => {
   const oldContent = oldMessage.content || '*Message content not available*';
   const newContent = newMessage.content || '*Message content not available*';

   const embed = new EmbedBuilder()
      .setColor('#FFA500')
      .setTitle(`${EMOJIS.EDIT} Message Edited`)
      .setThumbnail(author.displayAvatarURL())
      .addFields(
         {
            name: `${EMOJIS.AUTHOR} Author`,
            value: `${author.tag} (ID: ${author.id})`,
            inline: true,
         },
         {
            name: `${EMOJIS.CHANNEL} Channel`,
            value: `${newMessage.channel.name} (ID: ${newMessage.channel.id})`,
            inline: true,
         },
         { name: `${EMOJIS.OLD} Old Content`, value: oldContent },
         { name: `${EMOJIS.NEW} New Content`, value: newContent },
         { name: `${EMOJIS.TIME} Time`, value: time, inline: true },
         {
            name: `${EMOJIS.ID} Message ID`,
            value: newMessage.id,
            inline: true,
         },
         {
            name: `${EMOJIS.SERVER} Server`,
            value: newMessage.guild.name,
            inline: true,
         }
      )
      .setFooter({
         text: `Message Logger | ${newMessage.client.user.tag}`,
         iconURL: newMessage.client.user.displayAvatarURL(),
      })
      .setTimestamp();

   return embed;
};

const addEmbedFields = (embed, oldMessage, newMessage) => {
   const oldEmbeds =
      oldMessage.embeds.length > 0
         ? oldMessage.embeds.map((e) => e.toJSON())
         : null;
   const newEmbeds =
      newMessage.embeds.length > 0
         ? newMessage.embeds.map((e) => e.toJSON())
         : null;

   if (oldEmbeds) {
      embed.addFields({
         name: `${EMOJIS.EMBED} Old Embeds`,
         value: JSON.stringify(oldEmbeds, null, 2).slice(0, 1024),
      });
   }
   if (newEmbeds) {
      embed.addFields({
         name: `${EMOJIS.EMBED} New Embeds`,
         value: JSON.stringify(newEmbeds, null, 2).slice(0, 1024),
      });
   }
};

const addAttachmentFields = (embed, oldMessage, newMessage) => {
   const oldAttachments =
      oldMessage.attachments.size > 0
         ? oldMessage.attachments.map((a) => a.url).join('\n')
         : 'None';
   const newAttachments =
      newMessage.attachments.size > 0
         ? newMessage.attachments.map((a) => a.url).join('\n')
         : 'None';

   embed.addFields(
      { name: `${EMOJIS.ATTACHMENT} Old Attachments`, value: oldAttachments },
      { name: `${EMOJIS.ATTACHMENT} New Attachments`, value: newAttachments }
   );
};

const createErrorEmbed = (error, client) => {
   return new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle(`${EMOJIS.ERROR} Error Logging Edited Message`)
      .setDescription(
         `An error occurred while attempting to log an edited message: ${error.message}`
      )
      .setFooter({
         text: `Message Logger | ${client.user.tag}`,
         iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();
};

export default async (client, errorHandler, oldMessage, newMessage) => {
   if (newMessage.author.bot || newMessage.guild.id !== config.testServerId)
      return;
   if (
      oldMessage.content === newMessage.content &&
      oldMessage.embeds.length === newMessage.embeds.length &&
      oldMessage.attachments.size === newMessage.attachments.size
   )
      return;

   const logChannel = client.channels.cache.get(config.logChannel);
   if (!logChannel) {
      console.error(`Log channel with ID ${config.logChannel} not found.`);
      return;
   }

   try {
      const time = newMessage.editedAt
         ? newMessage.editedAt.toLocaleString()
         : new Date().toLocaleString();
      const embed = createMessageEmbed(
         oldMessage,
         newMessage,
         newMessage.author,
         time
      );
      addEmbedFields(embed, oldMessage, newMessage);
      addAttachmentFields(embed, oldMessage, newMessage);

      await logChannel.send({ embeds: [embed] });
   } catch (error) {
      console.error('Error logging edited message:', error);
      errorHandler.handleError(error, {
         type: 'messageEditLogging',
         messageId: newMessage.id,
      });

      try {
         const errorEmbed = createErrorEmbed(error, client);
         await logChannel.send({ embeds: [errorEmbed] });
      } catch (innerError) {
         console.error('Error logging the error:', innerError);
      }
   }
};
