/** @format */

import { SlashCommandBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

const maxBet = 250000;
const slots = [
  '🍆', // eggplant
  '❤️', // heart
  '🍒', // cherry
  '💰', // money bag
  '🔒', // lock
];
const spinningAnimation = '<a:slot_gif:1269381855468191854>';

export default {
  data: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Bet your money in the slot machine! Earn up to 10x your money!')
    .addStringOption((option) =>
      option
        .setName('bet')
        .setDescription('Amount to bet (or "all")')
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [],
  botPermissions: ['SendMessages'],
  cooldown: 15,
  category: 'economy',

  run: async (client, interaction) => {
    const userId = interaction.user.id;
    let betInput = interaction.options.getString('bet');
    let amount = 0;
    let all = false;

    // Parse bet amount
    if (betInput.toLowerCase() === 'all') {
      all = true;
    } else {
      amount = parseInt(betInput);
      if (isNaN(amount) || amount <= 0) {
        return interaction.reply({ content: 'Invalid bet amount!', ephemeral: true });
      }
    }

    // Check user's balance
    const userBalance = await Balance.findOne({ userId });
    if (!userBalance) {
      return interaction.reply({ content: "You don't have any money to bet!", ephemeral: true });
    }

    if (all) {
      amount = userBalance.balance;
    }

    if (amount > maxBet) {
      amount = maxBet;
    }

    if (userBalance.balance < amount) {
      return interaction.reply({ content: "You don't have enough money to place this bet!", ephemeral: true });
    }

    // Decide results
    const rand = Math.random() * 100;
    let win = 0;
    let rslots = [];

    if (rand <= 20) {
      win = amount;
      rslots = [slots[0], slots[0], slots[0]];
    } else if (rand <= 40) {
      win = amount * 2;
      rslots = [slots[1], slots[1], slots[1]];
    } else if (rand <= 45) {
      win = amount * 3;
      rslots = [slots[2], slots[2], slots[2]];
    } else if (rand <= 47.5) {
      win = amount * 4;
      rslots = [slots[3], slots[3], slots[3]];
    } else if (rand <= 48.5) {
      win = amount * 10;
      rslots = [slots[4], slots[4], slots[4]];
    } else {
      rslots = [
        slots[Math.floor(Math.random() * slots.length)],
        slots[Math.floor(Math.random() * slots.length)],
        slots[Math.floor(Math.random() * slots.length)],
      ];
    }

    // Update user's balance
    userBalance.balance += win - amount;
    await userBalance.save();

    // Display slots with animation
    let machine = `**  \`___SLOTS___\`**\n\` \` ${spinningAnimation} ${spinningAnimation} ${spinningAnimation} \` \` ${interaction.user.username} bet 💰 ${amount}\n  \`|         |\`\n  \`|         |\``;

    const message = await interaction.reply({ content: machine, fetchReply: true });

    // Simulate spinning animation
    for (let i = 0; i < 3; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const updatedSlots = spinningAnimation.repeat(2 - i) + ' ' + rslots.slice(0, i + 1).join(' ');
      machine = `**  \`___SLOTS___\`**\n\` \` ${updatedSlots} \` \` ${interaction.user.username} bet 💰 ${amount}\n  \`|         |\`\n  \`|         |\``;
      await message.edit({ content: machine });
    }

    // Display final result
    const winmsg = win === 0 ? 'nothing... :c' : `💰 ${win}`;
    machine = `**  \`___SLOTS___\`**\n\` \` ${rslots.join(' ')} \` \` ${interaction.user.username} bet 💰 ${amount}\n  \`|         |\`   and won ${winmsg}\n  \`|         |\``;
    await message.edit({ content: machine });
  },
};
