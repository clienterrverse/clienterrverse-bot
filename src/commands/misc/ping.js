import {
   EmbedBuilder,
   SlashCommandBuilder,
   version as discordJsVersion,
} from 'discord.js';
import { formatDistanceToNow } from 'date-fns';
import os from 'os';

export default {
   data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('Shows bot latency and other stats'),

   userPermissions: [],
   botPermissions: [],
   category: 'Misc',
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   prefix: true,

   run: async (client, interaction) => {
      try {
         const start = Date.now();
         await interaction.deferReply();
         const latency = Date.now() - start;
         const apiPing = Math.round(client.ws.ping);

         const getPingColor = (ping) =>
            ping < 150 ? '#00ff00' : ping < 250 ? '#ffff00' : '#ff0000';

         client.commandStats ??= { pingCount: 0, totalPing: 0 };
         client.commandStats.pingCount++;
         client.commandStats.totalPing += apiPing;

         const averagePing = (
            client.commandStats.totalPing / client.commandStats.pingCount
         ).toFixed(2);
         const uptime = client.readyAt
            ? formatDistanceToNow(client.readyAt, { addSuffix: true })
            : 'Bot not ready';

         const { heapUsed, rss } = process.memoryUsage();
         const systemUptime = os.uptime();

         const stats = [
            { name: '📡 Bot Latency', value: `${latency}ms` },
            { name: '🌐 API Latency', value: `${apiPing}ms` },
            { name: '📊 Average Ping', value: `${averagePing}ms` },
            { name: '⏱️ Uptime', value: uptime },
            {
               name: '🖥️ Memory Usage',
               value: `${(heapUsed / 1024 / 1024).toFixed(2)} MB / ${(rss / 1024 / 1024).toFixed(2)} MB`,
            },
            { name: '📚 Discord.js Version', value: discordJsVersion },
            { name: '🛠️ Node.js Version', value: process.version },
            {
               name: '⚙️ System Uptime',
               value: formatDistanceToNow(Date.now() - systemUptime * 1000, {
                  addSuffix: true,
               }),
            },
            {
               name: '🔢 Command Usage',
               value: `${client.commandStats.pingCount}`,
            },
         ];

         const pongEmbed = new EmbedBuilder()
            .setColor(getPingColor(apiPing))
            .setTitle('🏓 Pong!')
            .addFields(stats.map((stat) => ({ ...stat, inline: true })))
            .setFooter({
               text: `Requested by ${interaction.user.username}`,
               iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

         await interaction.editReply({ embeds: [pongEmbed] });
      } catch (error) {
         console.error('Error in ping command:', error);
         await interaction.editReply(
            'An error occurred while processing the command. Please try again later.'
         );
      }
   },
};
