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
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      try {
         await interaction.deferReply();

         const start = Date.now();
         const msg = await interaction.fetchReply();
         const latency = Date.now() - start;
         const apiPing = Math.round(client.ws.ping);

         const getPingColor = (ping) => {
            if (ping < 150) return '#00ff00';
            if (ping < 250) return '#ffff00';
            return '#ff0000';
         };

         if (!client.commandStats) {
            client.commandStats = { pingCount: 0, totalPing: 0 };
         }
         client.commandStats.pingCount += 1;
         client.commandStats.totalPing += apiPing;

         const averagePing =
            client.commandStats.pingCount > 0
               ? (
                    client.commandStats.totalPing /
                    client.commandStats.pingCount
                 ).toFixed(2)
               : 0;

         const uptime = client.readyAt
            ? formatDistanceToNow(client.readyAt, { includeSeconds: true })
            : 'Bot not ready';

         const memoryUsage = process.memoryUsage();
         const systemUptime = os.uptime();

         const pongEmbed = new EmbedBuilder()
            .setColor(getPingColor(apiPing))
            .setTitle('🏓 Pong!')
            .addFields(
               { name: '📡 Bot Latency', value: `${latency}ms`, inline: true },
               { name: '🌐 API Latency', value: `${apiPing}ms`, inline: true },
               {
                  name: '📊 Average Ping',
                  value: `${averagePing}ms`,
                  inline: true,
               },
               { name: '⏱️ Uptime', value: uptime, inline: true },
               {
                  name: '🖥️ Memory Usage',
                  value: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                  inline: true,
               },
               {
                  name: '📚 Discord.js Version',
                  value: discordJsVersion,
                  inline: true,
               },
               {
                  name: '🛠️ Node.js Version',
                  value: process.version,
                  inline: true,
               },
               {
                  name: '⚙️ System Uptime',
                  value: formatDistanceToNow(Date.now() - systemUptime * 1000, {
                     includeSeconds: true,
                  }),
                  inline: true,
               },
               {
                  name: '🔢 Command Usage',
                  value: `${client.commandStats.pingCount}`,
                  inline: true,
               }
            )
            .setFooter({
               text: `Requested by ${interaction.user.username}`,
               iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

         await interaction.editReply({ embeds: [pongEmbed] });
      } catch (error) {
         console.error(
            'An error occurred while processing ping command:',
            error
         );
         await interaction.editReply(
            'An error occurred while processing the command. Please try again later.'
         );
      }
   },
};
