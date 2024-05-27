import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';

export default async (interaction, pages, time = 30 * 1000) => {
  try {
    if (!interaction || !pages || pages.length === 0) throw new Error('Invalid arguments');

    await interaction.deferReply();

    if (pages.length === 1) {
      return await interaction.editReply({
        embeds: pages,
        components: [],
        fetchReply: true,
      });
    }

    const prev = new ButtonBuilder()
      .setCustomId('prev')
      .setEmoji('⬅️')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true);

    const home = new ButtonBuilder()
      .setCustomId('home')
      .setEmoji('🏠')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true);

    const next = new ButtonBuilder()
      .setCustomId('next')
      .setEmoji('➡️')
      .setStyle(ButtonStyle.Primary);

    const buttons = new ActionRowBuilder().addComponents([prev, home, next]);
    let index = 0;

    const msg = await interaction.editReply({
      embeds: [pages[index]],
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

      prev.setDisabled(index === 0);
      home.setDisabled(index === 0);
      next.setDisabled(index === pages.length - 1);

      await msg.edit({
        embeds: [pages[index]],
        components: [buttons],
      });

      collector.resetTimer();
    });

    collector.on('end', async () => {
      await msg.edit({
        embeds: [pages[index]],
        components: [],
      });
    });

    return msg;
  } catch (err) {
    console.error('Pagination error:', err);
  }
};
