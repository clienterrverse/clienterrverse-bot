/**
 * Import necessary modules and define constants for emojis used in logging.
 */
import { config } from '../../config/config.js';
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';

/**
 * Define a constant object for emojis used in logging messages.
 * @type {{LOG: string, ERROR: string, IMAGE: string, REACTION: string, DELETE: string, EDIT: string, CHANNEL: string, CONTENT: string, TIME: string, ID: string, SERVER: string}}
 */
const EMOJIS = {
  LOG: '📝',
  ERROR: '❌',
  IMAGE: '🖼️',
  REACTION: '👍',
  DELETE: '🗑️',
  EDIT: '✏️',
  CHANNEL: '💬',
  CONTENT: '📄',
  TIME: '🕒',
  ID: '🔢',
  SERVER: '🏠',
};

/**
 * Creates an embed for logging messages.
 * @param {Object} message - The message object from Discord.
 * @param {Object} author - The author of the message.
 * @param {string} content - The content of the message.
 * @param {string} time - The time the message was sent.
 * @param {string} [imageURL] - The URL of an image attachment, if any.
 * @returns {EmbedBuilder} The embed for logging the message.
 */
const createMessageEmbed = (message, author, content, time, imageURL) => {
  const embed = new EmbedBuilder()
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
        name: `${EMOJIS.CHANNEL} Channel`,
        value: `${message.channel.name} (ID: ${message.channel.id})`,
        inline: true,
      },
      { name: `${EMOJIS.CONTENT} Content`, value: content },
      { name: `${EMOJIS.TIME} Time`, value: time, inline: true },
      { name: `${EMOJIS.ID} Message ID`, value: message.id, inline: true },
      {
        name: `${EMOJIS.SERVER} Server`,
        value: message.guild.name,
        inline: true,
      }
    )
    .setFooter({
      text: `Message Logger | ${message.client.user.tag}`,
      iconURL: message.client.user.displayAvatarURL(),
    })
    .setTimestamp();

  if (imageURL) {
    embed.setImage(imageURL);
  }

  return embed;
};

/**
 * Creates an embed for error logging.
 * @param {Error} error - The error object.
 * @param {Object} client - The Discord client.
 * @returns {EmbedBuilder} The embed for error logging.
 */
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

/**
 * Extracts attachments from a message.
 * @param {Object} message - The message object from Discord.
 * @returns {Array} An array of attachments with their details.
 */
const getAttachments = (message) => {
  return message.attachments.map((attachment) => {
    return {
      name: attachment.name,
      url: attachment.url,
      contentType: attachment.contentType,
    };
  });
};

/**
 * Logs a message to a specified channel.
 * @param {Object} logChannel - The channel to log the message in.
 * @param {EmbedBuilder} embed - The embed to log.
 * @param {Array} attachments - An array of attachments to log.
 */
const logMessage = async (logChannel, embed, attachments) => {
  const files = attachments.map(
    (att) => new AttachmentBuilder(att.url, { name: att.name })
  );
  await logChannel.send({ embeds: [embed], files });
};

/**
 * The main function for logging messages.
 * @param {Object} client - The Discord client.
 * @param {Function} errorHandler - A function to handle errors.
 * @param {Object} message - The message object from Discord.
 */
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
    const attachments = getAttachments(message);
    const imageURL = attachments.find((att) =>
      att.contentType?.startsWith('image/')
    )?.url;

    const embed = createMessageEmbed(message, author, content, time, imageURL);

    await logMessage(logChannel, embed, attachments);

    // Log message edits
    const collector = message.channel.createMessageCollector({
      filter: (m) => m.id === message.id,
      time: 600000, // 10 minutes
    });

    collector.on('collect', async (newMessage) => {
      if (newMessage.editedAt) {
        const editEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle(`${EMOJIS.EDIT} Message Edited`)
          .setDescription(`[Jump to Message](${newMessage.url})`)
          .addFields(
            { name: 'Before', value: content },
            { name: 'After', value: newMessage.content }
          )
          .setFooter({
            text: `Edited at ${newMessage.editedAt.toLocaleString()}`,
            iconURL: author.displayAvatarURL(),
          });

        await logChannel.send({ embeds: [editEmbed] });
      }
    });
  } catch (error) {
    console.error('Error logging message:', error);
    errorHandler.handleError(error, {
      type: 'messageLogging',
      messageId: message.id,
    });

    try {
      const errorEmbed = createErrorEmbed(error, client);
      await logChannel.send({ embeds: [errorEmbed] });
    } catch (innerError) {
      console.error('Error logging the error:', innerError);
    }
  }
};
