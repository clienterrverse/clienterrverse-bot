/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('social')
    .setDescription('Test if everything works.')
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    const guild = interaction.guild;
    const guildIconURL = guild.iconURL({ dynamic: true, size: 256 }) || "";

    const embed = new EmbedBuilder()
      .setColor("#00acee")
      .setTitle("My Socials")
      .setDescription("Follow me on these platforms!")
      .addFields(
        {
          name: "Discord Server",
          value: "[Join my Discord Server](https://clienterr.com/discord)",
          inline: true,
        },
        {
          name: "YouTube",
          value: "[Subscribe to my YouTube Channel](https://clienterr.com/youtube)",
          inline: true,
        },
        {
          name: "Discord Username",
          value: ".clienterr",
          inline: true,
        },
        {
          name: "Telegram",
          value: "[Join my Telegram](https://clienterr.com/telegram)",
          inline: true,
        },
        {
          name: "GitHub",
          value: "[Check out my GitHub](https://clienterr.com/github)",
          inline: true,
        },
        {
          name: "GitHub Organisation",
          value: "[Check out my GitHub Organisation](https://clienterr.com/clienterrverse)",
          inline: true,
        },
        {
          name: "Twitter",
          value: "[Follow me on Twitter](https://clienterr.com/twitter)",
          inline: true,
        },
        {
          name: "Instagram",
          value: "[Follow me on Instagram](https://clienterr.com/instagram)",
          inline: true,
        },
        {
          name: "LinkedIn",
          value: "[Connect with me on LinkedIn](https://clienterr.com/linkedin)",
          inline: true,
        },
        {
          name: "Facebook",
          value: "[Like my Facebook Page](https://clienterr.com/facebook)",
          inline: true,
        },
        {
          name: "TikTok",
          value: "[Follow me on TikTok](https://clienterr.com/tiktok)",
          inline: true,
        },
        {
          name: "Reddit",
          value: "[Join my Reddit Community](https://clienterr.com/reddit)",
          inline: true,
        }
      )
      .setTimestamp();

    // Set the thumbnail only if the guild icon URL is available
    if (guildIconURL) {
      embed.setThumbnail(guildIconURL);
    }

    embed.setFooter({
      text: "Thank you for your support!",
      iconURL: "https://cdn.discordapp.com/avatars/1242892502768549969/d4eca7b8bfd004c2d1e016be39b66934.webp?size=1024&format=webp&width=0&height=240",
    });

    await interaction.reply({ embeds: [embed] });
  },
};
