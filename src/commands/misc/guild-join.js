import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } from 'discord.js';
import { formatDistanceToNow } from 'date-fns';

export default {
    data: new SlashCommandBuilder()
        .setName('guild-join')
        .setDescription('Join Hypixel guild'),
    
    userPermissions: [],
    botPermissions: [],
    cooldown: 5,
    nsfwMode: false,
    testMode: true,
    devOnly: true,

    run: async (client, interaction) => {
        try {
            await interaction.reply('Working on it...');
        } catch (error) {
            console.error('Error handling guild-join command:', error);
            await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    }
};
