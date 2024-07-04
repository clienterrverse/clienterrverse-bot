/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance, Transaction } from '../../schemas/economy.js';
import mconfig from '../../config/messageConfig.js';

export default {
  data: new SlashCommandBuilder()
    .setName('eco')
    .setDescription('Economy management commands')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add')
        .setDescription("Add clienterr coins to a user's balance")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user you want to add clienterr coins to')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of clienterr coins to add')
            .setRequired(true)
            .setMinValue(1)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('subtract')
        .setDescription("Subtract clienterr coins from a user's balance")
        .addUserOption((option) =>
          option
            .setName('user')
            .setDescription('The user you want to subtract clienterr coins from')
            .setRequired(true)
        )
        .addIntegerOption((option) =>
          option
            .setName('amount')
            .setDescription('The amount of clienterr coins to subtract')
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
    .toJSON(),
  userPermissions: [], 
  botPermissions: [],
  cooldown: 5, // Cooldown in seconds
  nsfwMode: false,
  testMode: false,
  devOnly: true,

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
      let color;
      let transactionType;

      switch (subcommand) {
        case 'add':
          userBalance.balance += amount;
          responseMessage = `Added ${amount} clienterr coins to ${user.username}'s balance. New balance: ${userBalance.balance} clienterr coins.`;
          color = mconfig.embedColorSuccess;
          transactionType = 'add';
          break;
        case 'subtract':
          if (userBalance.balance < amount) {
            return interaction.reply({
              embeds: [createErrorEmbed(interaction, 'Insufficient Balance', `${user.username} does not have enough balance to subtract ${amount} clienterr coins.`)],
              ephemeral: true
            });
          }
          userBalance.balance -= amount;
          responseMessage = `Subtracted ${amount} clienterr coins from ${user.username}'s balance. New balance: ${userBalance.balance} clienterr coins.`;
          color = mconfig.embedColorWarning;
          transactionType = 'subtract';
          break;
        case 'set':
          userBalance.balance = amount;
          responseMessage = `Set ${user.username}'s balance to ${amount} clienterr coins.`;
          color = mconfig.embedColorInfo;
          transactionType = 'set';
          break;
        case 'view':
          responseMessage = `${user.username}'s current balance: ${userBalance.balance} clienterr coins.`;
          color = mconfig.embedColorDefault;
          break;
      }

      if (subcommand !== 'view') {
        await userBalance.save();
        await Transaction.create({
          userId: user.id,
          type: transactionType,
          amount: amount,
          executorId: interaction.user.id
        });
      }

      const embed = new EmbedBuilder()
        .setDescription(responseMessage)
        .setColor(color)
        .setFooter({
          text: `Executed by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing eco command:', error);
      await interaction.reply({
        embeds: [createErrorEmbed(interaction, 'Error', 'There was an error processing your request.')],
        ephemeral: true
      });
    }
  },
};

function createErrorEmbed(interaction, title, description) {
  return new EmbedBuilder()
    .setColor(mconfig.embedColorError)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({
      text: `Requested by ${interaction.user.username}`,
      iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
    })
    .setTimestamp();
}