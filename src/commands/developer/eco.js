/** @format */

import {
  SlashCommandBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import { Balance, Transaction } from '../../schemas/economy.js';
import mconfig from '../../config/messageConfig.js';

const COLORS = {
  DEFAULT: 0x7289da, // Discord blurple
  SUCCESS: 0x43b581, // Discord green
  WARNING: 0xfaa61a, // Discord yellow
  INFO: 0x5865f2, // Discord blue
  ERROR: 0xed4245, // Discord red
};

export default {
  data: new SlashCommandBuilder()
    .setName('eco')
    .setDescription('Economy management commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription("Add coins to a user's balance")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user you want to add coins to')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of coins to add')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('subtract')
        .setDescription("Subtract coins from a user's balance")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user you want to subtract coins from')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of coins to subtract')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription("Set a user's balance to a specific amount")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user whose balance you want to set')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount to set the balance to')
            .setRequired(true)
            .setMinValue(0)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('view')
        .setDescription("View a user's balance")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user whose balance you want to view')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('reset')
        .setDescription("Reset a user's balance to 0")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user whose balance you want to reset')
            .setRequired(true)
        )
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .toJSON(),
  userPermissions: ['Administrator'],
  botPermissions: [],
  cooldown: 5,
  nsfwMode: false,
  testMode: false,
  devOnly: true,
  category: 'Developer',

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      let userBalance = await Balance.findOneAndUpdate(
        { userId: user.id },
        { $setOnInsert: { balance: 0, bank: 0 } },
        { upsert: true, new: true }
      );

      let responseMessage;
      let color = COLORS.DEFAULT; // Default color
      let transactionType;

      switch (subcommand) {
        case 'add':
          userBalance.balance += amount;
          responseMessage = `Added ${amount} coins to ${user.username}'s balance. New balance: ${userBalance.balance} coins.`;
          color = COLORS.SUCCESS;
          transactionType = 'add';
          break;
        case 'subtract':
          if (userBalance.balance < amount) {
            return interaction.reply({
              embeds: [
                createErrorEmbed(
                  interaction,
                  'Insufficient Balance',
                  `${user.username} does not have enough balance to subtract ${amount} coins.`
                ),
              ],
              ephemeral: true,
            });
          }
          userBalance.balance -= amount;
          responseMessage = `Subtracted ${amount} coins from ${user.username}'s balance. New balance: ${userBalance.balance} coins.`;
          color = COLORS.WARNING;
          transactionType = 'subtract';
          break;
        case 'set':
          userBalance.balance = amount;
          responseMessage = `Set ${user.username}'s balance to ${amount} coins.`;
          color = COLORS.INFO;
          transactionType = 'set';
          break;
        case 'view':
          responseMessage = `${user.username}'s current balance: ${userBalance.balance} coins.`;
          // color remains default
          break;
        case 'reset':
          userBalance.balance = 0;
          responseMessage = `Reset ${user.username}'s balance to 0 coins.`;
          color = COLORS.WARNING;
          transactionType = 'reset';
          break;
        default:
          throw new Error('Invalid subcommand');
      }

      if (subcommand !== 'view') {
        await userBalance.save();
        await Transaction.create({
          userId: user.id,
          type: transactionType,
          amount: subcommand === 'reset' ? userBalance.balance : amount,
          executorId: interaction.user.id,
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(responseMessage)
        .setColor(color)
        .setFooter({
          text: `Executed by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 1024,
          }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Economy command error:', error);
      await interaction.reply({
        embeds: [
          createErrorEmbed(
            interaction,
            'Error',
            'There was an error processing your request. Please try again later.'
          ),
        ],
        ephemeral: true,
      });
    }
  },
};

function createErrorEmbed(interaction, title, description) {
  return new EmbedBuilder()
    .setColor(COLORS.ERROR)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({
      text: `Requested by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL({
        format: 'png',
        dynamic: true,
        size: 1024,
      }),
    })
    .setTimestamp();
}
