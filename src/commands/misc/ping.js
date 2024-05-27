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
        if (interaction.replied || interaction.deferred) {
            return;
        }

        let pingColor = '';
        const ping = interaction.client.ws.ping;

        if (ping < 150) {
            pingColor = '#00ff00'; 
        } else if (ping >= 150 && ping <= 250) {
            pingColor = '#ffff00';
        } else {
            pingColor = '#ff0000'; 
        }

        const uptime = formatDistanceToNow(client.readyAt, { includeSeconds: true });

        if (!client.commandStats) {
            client.commandStats = {};
        }

        client.commandStats.ping = (client.commandStats.ping || 0) + 1;

        const totalPing = (client.commandStats.totalPing || 0) + ping;
        const averagePing = totalPing / client.commandStats.ping;

        const pongEmbed = new EmbedBuilder()
            .setColor(pingColor) // Set embed color based on ping
            .setTitle('Pong') // Set embed title
            .setDescription(`**Ping:** ${ping} ms\n**Average Ping:** ${averagePing.toFixed(2)} ms\n**Uptime:** ${uptime}\n**Command Usage:** ${client.commandStats.ping}`)
            .setFooter({
                text: `Requested by ${interaction.user.username}`,
                iconURL: `${interaction.user.displayAvatarURL({ dynamic: true })}`,
            })
            .setTimestamp(); 

        await interaction.reply({ embeds: [pongEmbed] });
    }
};