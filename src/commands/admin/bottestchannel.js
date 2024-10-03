import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
} from 'discord.js';
import config from '../../config/config.js';

export default {
  data: new SlashCommandBuilder()
    .setName('bottestchannel')
    .setDescription(
      'Creates a bot-testing channel under a bot-development category for developers only'
    ),
  botPermissions: [PermissionFlagsBits.ManageChannels],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: true,
  category: 'Developer',
  run: async (client, interaction) => {
    const { guild, member } = interaction;

    try {
      let category = await guild.channels.cache.find(
        (c) =>
          c.name === 'bot-development' && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        category = await guild.channels.create({
          name: 'bot-development',
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel],
            },
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
              ],
            },
          ],
        });
      }
      const existingChannel = guild.channels.find(
        (c) => c.name === 'bot-testing' && c.parentId === category.id
      );
      if (existingChannel) {
        return await interaction.reply({
          content: `A testing channe alredy alredy exis ${existingChannel}`,
          ephemeral: true,
        });
      }

      // Create the bot-testing channel under the bot-development category
      const channel = await guild.channels.create({
        name: 'bot-testing',
        type: ChannelType.GuildText,
        parent: category.id,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: member.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
            ],
          },
        ],
      });

      await interaction.reply({
        content: `Channel ${channel} created successfully under the ${category.name} category for developers.`,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error creating channel:', error);
      await interaction.reply({
        content:
          'There was an error creating the channel. Please try again later.',
        ephemeral: true,
      });
    }
  },
};
