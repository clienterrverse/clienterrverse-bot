import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { formatDistanceToNow } from 'date-fns';

// Export the module to be used elsewhere
export default {
    // Slash command data
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Bot ping'),

    userPermissions: [],
    bot: [],
    cooldown: 5,
    nwfwMode: false,
    testMode: false,
    devOnly: false,

    run: async (client, interaction) => {
        try {
            if (interaction.replied || interaction.deferred) {
                console.error('Interaction has already been acknowledged.');
                return;
            }

            const ping = interaction.client.ws.ping;

            let pingColor = '';
            if (ping < 150) {
                pingColor = '#00ff00'; // Green
            } else if (ping >= 150 && ping <= 250) {
                pingColor = '#ffff00'; // Yellow
            } else {
                pingColor = '#ff0000'; // Red
            }

            let uptime = 'Bot not ready'; // Default value if client.readyAt is not set
            if (client.readyAt) {
                uptime = formatDistanceToNow(client.readyAt, { includeSeconds: true });
            }

            // Initialize commandStats if not already initialized
            if (!client.commandStats) {
                client.commandStats = {
                    pingCount: 0,
                    totalPing: 0
                };
            }

            // Update commandStats
            client.commandStats.pingCount += 1;
            client.commandStats.totalPing += ping;

            // Calculate average ping only if there have been pings
            const averagePing = client.commandStats.pingCount > 0 ? client.commandStats.totalPing / client.commandStats.pingCount : 0;

            const pongEmbed = new EmbedBuilder()
                .setColor(pingColor)
                .setTitle('Pong')
                .setDescription(`**Ping:** ${ping} ms\n**Average Ping:** ${averagePing.toFixed(2)} ms\n**Uptime:** ${uptime}\n**Command Usage:** ${client.commandStats.pingCount}`)
                .setFooter({
                    text: `Requested by ${interaction.user.username}`,
                    iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
                })
                .setTimestamp();

            await interaction.reply({ embeds: [pongEmbed] });
        } catch (error) {
            console.error('An error occurred while processing command:', error.message);
        }
    }
};
