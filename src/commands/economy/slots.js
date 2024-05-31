import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance, } from '../../schemas/economy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the slot machine.   win')
    .addNumberOption(option =>
      option.setName('bet')
        .setDescription('Amount to bet (max 10)')
        .setRequired(true))
    .toJSON(),
  userPermissions: [],
  botPermissions: [],
  cooldown: 10, // 5 minutes
  nsfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    try {
      const userId = interaction.user.id;
      const bet = interaction.options.getNumber('bet');
      const SCooldown = 5 * 60 * 1000; // 1 hour in milliseconds

      if (bet > 10) {
        const rembed = new EmbedBuilder().setDescription('The maximum bet amount is 10 coins.');
        return interaction.reply({ embeds: [rembed], ephemeral: true });
      }

      const userBalance = await Balance.findOne({ userId });
      if (!userBalance || userBalance.balance < bet) {
        const rembed = new EmbedBuilder().setDescription('You do not have enough coins to place this bet.');
        return interaction.reply({ embeds: [rembed], ephemeral: true });
      }
      const now = Date.now();

      if(userBalance.lastSlots && (now - userBalance.lastSlots.getTime()) < SCooldown) {
        const timeleft  = SCooldown - (now - userBalance.lastSlots.getTime());
        const minutes = Math.floor(timeLeft / (1000 * 60));
        const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
        const rembed = new EmbedBuilder().setDescription(`You need to wait ${minutes} minutes and ${seconds} seconds before using this command again.`);
        return interaction.reply({ embeds: [rembed], ephemeral: true });

      }


      const slots = ['🍒', '🍋', '🍉', '🍇', '🍓'];
      const result = [
        slots[Math.floor(Math.random() * slots.length)],
        slots[Math.floor(Math.random() * slots.length)],
        slots[Math.floor(Math.random() * slots.length)]
      ];
      const win = result[0] === result[1] && result[1] === result[2];

      userBalance.balance += win ? bet * 5 : -bet; // 5x payout on win
      userBalance.lastSlots = new Date();
      await userBalance.save();

      const responseEmbed = new EmbedBuilder()
        .setDescription(`🎰 | ${result.join(' ')} | You ${win ? 'won' : 'lost'} ${win ? bet * 5 : bet} coins! Your new balance is ${userBalance.balance} coins.`);
      await interaction.reply({ embeds: [responseEmbed], ephemeral: true });

      
    } catch (error) {
      console.error(error);
      const rembed = new EmbedBuilder().setDescription('Something went wrong while processing your slots command. Please try again later.');
      return interaction.reply({ embeds: [rembed], ephemeral: true });
    }
  },
};
