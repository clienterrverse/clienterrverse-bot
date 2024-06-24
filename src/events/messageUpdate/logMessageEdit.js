import config from '../../config/config.json' assert { type: 'json' };
import { EmbedBuilder } from 'discord.js';

export default async (client, oldMessage, newMessage) => {
    try {
        // Ignore messages from other bots
        if (newMessage.author.bot) return;

        // Check if the message is from the test server
        if (newMessage.guild.id !== config.testServerId) return;

        const channelId = config.logChannel; // Replace with your log channel ID

        // Fetch the logging channel
        const channel = client.channels.cache.get(channelId);
        if (!channel) {
            console.error(`Log channel with ID ${channelId} not found.`);
            return;
        }

        const author = newMessage.author;
        const oldContent = oldMessage.content || '*Message content not available*';
        const newContent = newMessage.content || '*Message content not available*';
        const time = newMessage.editedAt ? newMessage.editedAt.toLocaleString() : new Date().toLocaleString();

        // Check for embeds
        const oldEmbeds = oldMessage.embeds.length > 0 ? oldMessage.embeds.map(embed => embed.toJSON()) : '*No embeds*';
        const newEmbeds = newMessage.embeds.length > 0 ? newMessage.embeds.map(embed => embed.toJSON()) : '*No embeds*';

        // Create the embed
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Message Edited')
            .setThumbnail(author.displayAvatarURL())
            .addFields(
                { name: 'Author', value: `${author.tag} (ID: ${author.id})`, inline: true },
                { name: 'Channel', value: `${newMessage.channel.name} (ID: ${newMessage.channel.id})`, inline: true },
                { name: 'Old Content', value: oldContent },
                { name: 'New Content', value: newContent },
                { name: 'Time', value: time, inline: true },
                { name: 'Message ID', value: newMessage.id, inline: true },
                { name: 'Server', value: newMessage.guild.name, inline: true }
            )
            .setFooter({ text: `Message Logger | ${client.user.tag}`, iconURL: client.user.displayAvatarURL() })
            .setTimestamp();

        // Include embed details if present
        if (oldEmbeds !== '*No embeds*') {
            embed.addFields({ name: 'Old Embeds', value: JSON.stringify(oldEmbeds, null, 2).slice(0, 1024) });
        }
        if (newEmbeds !== '*No embeds*') {
            embed.addFields({ name: 'New Embeds', value: JSON.stringify(newEmbeds, null, 2).slice(0, 1024) });
        }

        // Send the embed to the logging channel
        await channel.send({ embeds: [embed] });

    } catch (error) {
        console.error('Error logging edited message:', error);

        // Attempt to log the error in the logging channel
        try {
            const errorChannel = client.channels.cache.get(config.logChannel);
            if (!errorChannel) {
                console.error(`Log channel with ID ${config.logChannel} not found.`);
                return;
            }

            // Create an error embed
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('Error Logging Edited Message')
                .setDescription(`An error occurred while attempting to log an edited message: ${error.message}`)
                .setFooter({ text: `Message Logger | ${client.user.tag}`, iconURL: client.user.displayAvatarURL() })
                .setTimestamp();

            // Send the error embed to the logging channel
            await errorChannel.send({ embeds: [errorEmbed] });

        } catch (innerError) {
            console.error('Error logging the error:', innerError);
        }
    }
};
