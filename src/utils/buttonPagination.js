import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

// Helper function to create a button
const createButton = (customId, emoji, style, disabled = false) =>
    new ButtonBuilder()
        .setCustomId(customId)
        .setEmoji(emoji)
        .setStyle(style)
        .setDisabled(disabled);

// Helper function to update button states
const updateButtons = (buttons, index, pagesLength) => {
    buttons[0].setDisabled(index === 0); // Previous button
    buttons[1].setDisabled(index === 0); // Home button
    buttons[2].setDisabled(index === pagesLength - 1); // Next button
};

export default async (interaction, pages, time = 30 * 1000, buttonEmojis = { prev: '⬅️', home: '🏠', next: '➡️' }, buttonStyles = { prev: ButtonStyle.Primary, home: ButtonStyle.Secondary, next: ButtonStyle.Primary }) => {
    try {
        if (!interaction) throw new Error('Invalid interaction');
        if (!pages || !Array.isArray(pages) || pages.length === 0) throw new Error('Invalid pages array');

        await interaction.deferReply();

        if (pages.length === 1) {
            return await interaction.editReply({
                embeds: pages,
                components: [],
                fetchReply: true,
            });
        }

        // Initialize buttons with custom or default emojis and styles
        const prev = createButton('prev', buttonEmojis.prev, buttonStyles.prev, true);
        const home = createButton('home', buttonEmojis.home, buttonStyles.home, true);
        const next = createButton('next', buttonEmojis.next, buttonStyles.next);

        const buttons = new ActionRowBuilder().addComponents(prev, home, next);
        let index = 0;

        // Use a Map for caching pages
        const pageCache = new Map();

        // Function to get the embed with page number
        const getEmbed = (index) => {
            if (!pageCache.has(index)) {
                const embed = pages[index];
                embed.setFooter(`Page ${index + 1} of ${pages.length}`);
                pageCache.set(index, embed);
            }
            return pageCache.get(index);
        };

        const msg = await interaction.editReply({
            embeds: [getEmbed(index)],
            components: [buttons],
            fetchReply: true,
        });

        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time,
        });

        collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: 'You are not allowed to do this!', ephemeral: true });

            await i.deferUpdate();

            if (i.customId === 'prev' && index > 0) {
                index--;
            } else if (i.customId === 'home') {
                index = 0;
            } else if (i.customId === 'next' && index < pages.length - 1) {
                index++;
            }

            updateButtons([prev, home, next], index, pages.length);

            await msg.edit({
                embeds: [getEmbed(index)],
                components: [buttons],
            });

            collector.resetTimer();
        });

        collector.on('end', async () => {
            await msg.edit({
                embeds: [getEmbed(index)],
                components: [],
            }).catch(() => null);  // Handle cases where the message might be deleted
        });

        return msg;
    } catch (err) {
        console.error('Pagination error:', err.message);
        console.error(err.stack);
        if (interaction && !interaction.replied) {
            await interaction.reply({ content: 'An error occurred while setting up pagination.', ephemeral: true });
        }
    }
};
