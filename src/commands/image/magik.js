import {
  EmbedBuilder,
  SlashCommandBuilder,
  ApplicationCommandType,
} from 'discord.js';
import axios from 'axios';
import mconfig from '../../config/messageConfig.js';
import pagination from '../../utils/buttonPagination.js';

const TIMEOUT = 15000;
const MAX_PAGES = 5;

export default {
  data: new SlashCommandBuilder()
    .setName('magik')
    .setDescription('Create multiple magik images')
    .addUserOption((option) =>
      option
        .setName('target')
        .setDescription('User to magik')
        .setRequired(false)
    )
    .addIntegerOption((option) =>
      option
        .setName('intensity')
        .setDescription('Magik intensity (1-10)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
    )
    .addIntegerOption((option) =>
      option
        .setName('count')
        .setDescription('Number of images to generate (1-5)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(5)
    )
    .setContexts([0, 1, 2])
    .setIntegrationTypes([0, 1])
    .toJSON(),
  cooldown: 10,
  nsfwMode: false,
  testMode: false,
  category: 'Image',
  devOnly: false,
  userPermissionsBitField: [],
  bot: [],

  run: async (client, interaction) => {
    await interaction.deferReply();

    const targetUser =
      interaction.options.getUser('target') || interaction.user;
    const intensity = interaction.options.getInteger('intensity') || 5;
    const count = interaction.options.getInteger('count') || 1;

    if (typeof intensity !== 'number' || typeof count !== 'number') {
      return interaction.editReply('Intensity and count must be numbers.');
    }

    await generateAndSendMagik(interaction, targetUser, intensity, count);
  },

  contextMenu: {
    name: 'Magik User Avatar',
    type: ApplicationCommandType.User,
    run: async (client, interaction) => {
      await interaction.deferReply();

      const targetUser = interaction.targetUser;
      const intensity = 5; // Default intensity for context menu
      const count = 1; // Default count for context menu

      await generateAndSendMagik(interaction, targetUser, intensity, count);
    },
  },
};

async function generateAndSendMagik(interaction, targetUser, intensity, count) {
  try {
    const avatarURL = targetUser.displayAvatarURL({
      size: 512,
      extension: 'png',
      forceStatic: true,
    });

    const pages = [];

    for (let i = 0; i < count; i++) {
      const response = await axios.get(
        `https://nekobot.xyz/api/imagegen?type=magik&image=${encodeURIComponent(
          avatarURL
        )}&intensity=${intensity}`,
        { timeout: TIMEOUT }
      );

      if (!response.data || !response.data.message) {
        throw new Error('Failed to generate magik image.');
      }

      const magikImageURL = response.data.message;
      const embed = createEmbed(
        targetUser,
        intensity,
        magikImageURL,
        interaction.user.username,
        i + 1,
        count
      );
      pages.push(embed);
    }

    await pagination(interaction, pages, 60000); // Use 60 seconds for pagination timeout
  } catch (error) {
    handleError(interaction, error);
  }
}

function createEmbed(
  targetUser,
  intensity,
  magikImageURL,
  requester,
  currentPage,
  totalPages
) {
  return new EmbedBuilder()
    .setTitle('🎭 Magik')
    .setColor(mconfig.embedColorDefault || 0x7289da)
    .setImage(magikImageURL)
    .setURL(magikImageURL)
    .setDescription(`Magik'd image of ${targetUser.username}`)
    .addFields(
      {
        name: '🧙‍♂️ Requested by',
        value: requester,
        inline: true,
      },
      {
        name: '🔮 Intensity',
        value: `${intensity}/10`,
        inline: true,
      },
      {
        name: '🖼️ Generated Image',
        value: `[Open Image](${magikImageURL})`,
        inline: true,
      }
    )
    .setFooter({
      text: `Powered by nekobot.xyz | Image ${currentPage}/${totalPages}`,
    })
    .setTimestamp();
}

function handleError(interaction, error) {
  console.error('Error generating magik image:', error);
  const errorMessage =
    error.response?.status === 524
      ? 'The image generation service is currently overloaded. Please try again later.'
      : error.message ||
        'Sorry, something went wrong while generating the magik image.';

  interaction.editReply({
    content: errorMessage,
    embeds: [],
    components: [],
  });
}
