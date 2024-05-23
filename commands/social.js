const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("social")
    .setDescription("Displays the social media links of clienterr."), //change it to your name but still clienterr on top!!
  async execute(interaction) {
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
          value:
            "[Subscribe to my YouTube Channel](https://clienterr.com/youtube)",
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
          value:
            "[Check out my GitHub Organisation](https://clienterr.com/clienterrverse)",
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
      iconURL:
        "https://cdn.discordapp.com/avatars/1242892502768549969/d4eca7b8bfd004c2d1e016be39b66934.webp?size=1024&format=webp&width=0&height=240",
    });

    await interaction.reply({ embeds: [embed] });
  },
};
