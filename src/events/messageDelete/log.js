import config from "../../config/config.json" assert { type: "json" };
import { EmbedBuilder } from "discord.js";

export default async (client, message) => {
  try {
    if (message.author.bot) return;

    const yourServerId = "1207374906296246282"; // Replace with your actual server ID
    const yourLogChannelId = config.yourLogChannel; // Replace with your log channel ID for your server
    const otherLogChannelId = config.otherLogChannel; // Replace with your log channel ID for other servers

    let logChannelId;
    if (message.guild.id === yourServerId) {
      logChannelId = yourLogChannelId;
    } else {
      logChannelId = otherLogChannelId;
    }

    // Fetch the logging channel
    const logChannel = client.channels.cache.get(logChannelId);
    if (!logChannel) {
      console.error(`Log channel with ID ${logChannelId} not found.`);
      return;
    }

    const author = message.author;
    const content = message.content || "*Message content not available*";
    const time = message.createdAt.toLocaleString();

    // Check for attachments
    let imageURL = null;
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      if (
        attachment &&
        attachment.contentType &&
        attachment.contentType.startsWith("image/")
      ) {
        imageURL = attachment.url;
      }
    }

    // Create the embed
    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle("Message Deleted")
      .setThumbnail(author.displayAvatarURL())
      .addFields(
        {
          name: "Author",
          value: `${author.tag} (ID: ${author.id})`,
          inline: true,
        },
        {
          name: "Channel",
          value: `${message.channel.name} (ID: ${message.channel.id})`,
          inline: true,
        },
        { name: "Content", value: content },
        { name: "Time", value: time, inline: true },
        { name: "Message ID", value: message.id, inline: true },
        { name: "Server", value: message.guild.name, inline: true }
      )
      .setFooter({
        text: `Message Logger | ${client.user.tag}`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTimestamp();

    if (imageURL) {
      embed.setImage(imageURL);
    }

    // Send the embed to the logging channel
    await logChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error("Error logging message:", error);

    // Attempt to log the error in the appropriate logging channel
    try {
      const yourLogChannel = client.channels.cache.get(config.yourLogChannel);
      const otherLogChannel = client.channels.cache.get(config.otherLogChannel);
      const errorChannel = yourLogChannel || otherLogChannel;

      if (!errorChannel) {
        console.error("Log channels not found.");
        return;
      }

      // Create an error embed
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Error Logging Message")
        .setDescription(
          `An error occurred while attempting to log a message: ${error.message}`
        )
        .setFooter({
          text: `Message Logger | ${client.user.tag}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setTimestamp();

      // Send the error embed to the logging channel
      await errorChannel.send({ embeds: [errorEmbed] });
    } catch (innerError) {
      console.error("Error logging the error:", innerError);
    }
  }
};
