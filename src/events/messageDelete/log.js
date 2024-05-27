import config from '../../config/config.json' assert { type: 'json' };
import { EmbedBuilder } from 'discord.js';

export default async (client, message) => {
  try {
    if (message.author.bot) return;

    const channelId = config.logChannel; // Replace with your log channel ID

    // Ignore messages from other bots

    // Fetch the logging channel
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      console.error(`Log channel with ID ${channelId} not found.`);
      return;
    }

    const author = message.author;
    const content = message.content || '*Message content not available*';
    const time = message.createdAt.toLocaleString();

        // Check for attachments
    let imageURL = null;
        if (message.attachments.size > 0) {
          const attachment = message.attachments.first();
          if (attachment && attachment.contentType && attachment.contentType.startsWith('image/')) {
            imageURL = attachment.url;
          }
        }
    

    // Create the embed
    const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('Message Logged')
      .setThumbnail(author.displayAvatarURL())
      .addFields(
        { name: 'Author', value: `${author.tag} (ID: ${author.id})`, inline: true },
        { name: 'Channel', value: `${message.channel.name} (ID: ${message.channel.id})`, inline: true },
        { name: 'Content', value: content },
        { name: 'Time', value: time, inline: true },
        { name: 'Message ID', value: message.id, inline: true },
        { name: 'Server', value: message.guild.name, inline: true }
      )
      .setFooter({ text: `Message Logger | ${client.user.tag}`, iconURL: client.user.displayAvatarURL() })
      .setTimestamp();
    
      if (imageURL) {
        embed.setImage(imageURL);
      }
  

    // Send the embed to the logging channel
    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error('Error logging message:', error);

    // Attempt to log the error in the logging channel
    try {
      const channelId = config.logChannel; // Replace with your log channel ID
      const errorChannel = client.channels.cache.get(channelId);
      if (!errorChannel) {
        console.error(`Log channel with ID ${channelId} not found.`);
        return;
      }

      // Create an error embed
      const errorEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Error Logging Message')
        .setDescription(`An error occurred while attempting to log a message: ${error.message}`)
        .setFooter({ text: `Message Logger | ${client.user.tag}`, iconURL: client.user.displayAvatarURL() })
        .setTimestamp();

      // Send the error embed to the logging channel
      await errorChannel.send({ embeds: [errorEmbed] });
    } catch (innerError) {
      console.error('Error logging the error:', innerError);
    }
  }
};
