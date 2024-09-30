import {
  EmbedBuilder,
  SlashCommandBuilder,
  version as discordJsVersion,
} from 'discord.js';
import { formatDistanceToNow } from 'date-fns';
import os from 'os';
import { performance } from 'perf_hooks';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Shows bot latency and other detailed system stats'),

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
      const start = performance.now();
      await interaction.deferReply();
      const latency = Math.round(performance.now() - start);
      const apiPing = Math.round(client.ws.ping);

      const getPingColor = (ping) =>
        ping < 100 ? '#00ff00' : ping < 200 ? '#ffff00' : '#ff0000';

      client.commandStats ??= {
        pingCount: 0,
        totalPing: 0,
        totalCommands: 0,
      };
      client.commandStats.pingCount++;
      client.commandStats.totalPing += apiPing;
      client.commandStats.totalCommands++;

      const averagePing = (
        client.commandStats.totalPing / client.commandStats.pingCount
      ).toFixed(2);
      const uptime = client.readyAt
        ? formatDistanceToNow(client.readyAt, { addSuffix: true })
        : 'Bot not ready';

      const { heapUsed, rss } = process.memoryUsage();
      const totalMem = os.totalmem() / 1024 / 1024;
      const freeMem = os.freemem() / 1024 / 1024;
      const systemUptime = os.uptime();
      const cpuUsage = os.loadavg()[0].toFixed(2);

      const stats = [
        { name: '🏓 Bot Latency', value: `${latency}ms`, inline: true },
        { name: '🌐 API Latency', value: `${apiPing}ms`, inline: true },
        { name: '📊 Average Ping', value: `${averagePing}ms`, inline: true },
        { name: '⏳ Uptime', value: uptime, inline: true },
        {
          name: '💾 Memory Usage',
          value: `${(heapUsed / 1024 / 1024).toFixed(2)} MB / ${(rss / 1024 / 1024).toFixed(2)} MB`,
          inline: true,
        },
        {
          name: '🧠 System Memory',
          value: `${(((totalMem - freeMem) / totalMem) * 100).toFixed(2)}% used`,
          inline: true,
        },
        { name: '📚 Discord.js', value: discordJsVersion, inline: true },
        { name: '🛠️ Node.js', value: process.version, inline: true },
        {
          name: '⚙️ System Uptime',
          value: formatDistanceToNow(Date.now() - systemUptime * 1000, {
            addSuffix: true,
          }),
          inline: true,
        },
        { name: '💻 OS', value: `${os.type()} ${os.release()}`, inline: true },
        {
          name: '🖥️ CPU',
          value: `${os.cpus()[0].model.split(' ')[0]} (${os.cpus().length} cores)`,
          inline: true,
        },
        { name: '📈 CPU Usage', value: `${cpuUsage}%`, inline: true },
        {
          name: '🔢 Commands Run',
          value: client.commandStats.totalCommands.toString(),
          inline: true,
        },
      ];

      const pongEmbed = new EmbedBuilder()
        .setColor(getPingColor(apiPing))
        .setTitle('🚀 Bot Status')
        .setDescription(
          "Here's a detailed overview of the bot's current performance and system statistics."
        )
        .addFields(stats)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [pongEmbed] });
    } catch (error) {
      console.error('Error in ping command:', error);

      await interaction.editReply({
        content:
          '❌ An error occurred while processing the command. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
