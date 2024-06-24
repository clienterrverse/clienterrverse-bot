import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import axios from 'axios';

export default {
    data: new SlashCommandBuilder()
        .setName('magik')
        .setDescription('Create a magik image')
        .addUserOption(option => option.setName('target').setDescription('User to magik').setRequired(false))
        .toJSON(),
    nwfwMode: false,
    testMode: false,
    devOnly: false,
    userPermissionsBitField: [],
    bot: [],
    run: async (client, interaction) => {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('target') || interaction.user;
            const avatarURL = targetUser.displayAvatarURL({ size: 512, extension: 'jpg', forceStatic: true });

            // Fetch the magik image
            const response = await axios.get(`https://nekobot.xyz/api/imagegen?type=magik&image=${encodeURIComponent(avatarURL)}`);

            // Check if the API request was successful
            if (!response.data || !response.data.message) {
                throw new Error('Failed to generate magik image.');
            }

            const magikImageURL = response.data.message;

            const embed = new EmbedBuilder()
                .setTitle('Magik')
                .setColor('#FF0000') // Set a custom color for the embed (optional)
                .setImage(magikImageURL)
                .setURL(magikImageURL) // Set the URL of the embed (optional)
                .setDescription(`Magik'd image of ${targetUser.username}`)
                .addFields(
                    { name: 'Requested by', value: interaction.user.username, inline: true },
                    { name: 'Generated Image', value: `[Open Image](${magikImageURL})`, inline: true }
                );

            // Send the embed message as a reply
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error generating magik image:', error);
            // If deferReply failed, use followUp instead of editReply
            if (interaction.deferred) {
                await interaction.editReply('Sorry, something went wrong while generating the magik image.');
            } else {
                await interaction.reply('Sorry, something went wrong while generating the magik image.');
            }
        }
    },
};
