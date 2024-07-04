/** @format */

import { EmbedBuilder, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import axios from "axios";
import mconfig from '../../config/messageConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName("magik")
    .setDescription("Create a magik image")
    .addUserOption((option) =>
      option
        .setName("target")
        .setDescription("User to magik")
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName("intensity")
        .setDescription("Magik intensity (1-10)")
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .toJSON(),
  cooldown: 10,
  nsfwMode: false,
  testMode: false,
  devOnly: false,
  userPermissionsBitField: [],
  bot: [],

  run: async (client, interaction) => {
    try {
      await interaction.deferReply();

      const targetUser = interaction.options.getUser("target") || interaction.user;
      const intensity = interaction.options.getInteger("intensity") || 5;

      const avatarURL = targetUser.displayAvatarURL({
        size: 512,
        extension: "png",
        forceStatic: true,
      });

      // Fetch the magik image
      const response = await axios.get(
        `https://nekobot.xyz/api/imagegen?type=magik&image=${encodeURIComponent(
          avatarURL
        )}&intensity=${intensity}`,
        { timeout: 15000 } // Set a timeout of 15 seconds
      );

      if (!response.data || !response.data.message) {
        throw new Error("Failed to generate magik image.");
      }

      const magikImageURL = response.data.message;

      const embed = new EmbedBuilder()
        .setTitle("🎭 Magik")
        .setColor(mconfig.embedColorDefault)
        .setImage(magikImageURL)
        .setURL(magikImageURL)
        .setDescription(`Magik'd image of ${targetUser.username}`)
        .addFields(
          {
            name: "🧙‍♂️ Requested by",
            value: interaction.user.username,
            inline: true,
          },
          {
            name: "🔮 Intensity",
            value: `${intensity}/10`,
            inline: true,
          },
          {
            name: "🖼️ Generated Image",
            value: `[Open Image](${magikImageURL})`,
            inline: true,
          }
        )
        .setFooter({ text: "Powered by nekobot.xyz" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('regenerate')
          .setLabel('🔄 Regenerate')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setURL(magikImageURL)
          .setLabel('🔗 Open Image')
          .setStyle(ButtonStyle.Link)
      );

      const reply = await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = i => i.customId === 'regenerate' && i.user.id === interaction.user.id;
      const collector = reply.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', async i => {
        await i.deferUpdate();
        const newResponse = await axios.get(
          `https://nekobot.xyz/api/imagegen?type=magik&image=${encodeURIComponent(avatarURL)}&intensity=${intensity}`,
          { timeout: 15000 }
        );
        const newMagikImageURL = newResponse.data.message;
        embed.setImage(newMagikImageURL).setURL(newMagikImageURL);
        row.components[1].setURL(newMagikImageURL);
        await i.editReply({ embeds: [embed], components: [row] });
      });

      collector.on('end', () => {
        row.components[0].setDisabled(true);
        interaction.editReply({ components: [row] });
      });

    } catch (error) {
      console.error("Error generating magik image:", error);
      const errorMessage = error.response?.status === 524 
        ? "The image generation service is currently overloaded. Please try again later."
        : "Sorry, something went wrong while generating the magik image.";
      
      if (interaction.deferred) {
        await interaction.editReply({
          content: errorMessage,
          embeds: [],
          components: []
        });
      } else {
        await interaction.reply({
          content: errorMessage,
          ephemeral: true
        });
      }
    }
  },
};