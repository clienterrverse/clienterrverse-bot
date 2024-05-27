import { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder } from 'discord.js';

import { formatDistanceToNow } from 'date-fns';

// Export the module to be used elsewhere
export default {
    // Slash command data
    data: new SlashCommandBuilder()
        .setName('guild-join') 
        .setDescription('join hypixel guild'), 

    userPermissions: [],
    bot: [],
    cooldown: 5, 
    nwfwMode: false,
    testMode: true,
    devOnly: true,


    run: async (client, interaction) => {


      
        await interaction.reply('Workin on it ');
    }
};
