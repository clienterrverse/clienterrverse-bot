/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

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
    .toJSON(),
  userPermissions: [], // Adjust permissions as necessary
  botPermissions: [],
  cooldown: 0, // Cooldown in seconds
  nwfwMode: false,
  testMode: false,
  devOnly: true,

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    try {
      let userBalance = await Balance.findOne({ userId: user.id });

      if (!userBalance) {
        userBalance = new Balance({ userId: user.id, balance: 0 });
      }

      let responseMessage;
      let color;

      if (subcommand === 'add') {
        userBalance.balance += amount;
        responseMessage = `Added ${amount} clienterr coins to ${user.username}'s balance. New balance: ${userBalance.balance} clienterr coins.`;
        color = '#00FF00'; // Green for success
      } else if (subcommand === 'subtract') {
        if (userBalance.balance < amount) {
          return interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setDescription(`${user.username} does not have enough balance to subtract ${amount} clienterr coins.`)
                .setColor('#FF0000') // Red for error
            ]
          });
        }

        userBalance.balance -= amount;
        responseMessage = `Subtracted ${amount} clienterr coins from ${user.username}'s balance. New balance: ${userBalance.balance} clienterr coins.`;
        color = '#FFA500'; // Orange for warning
      }

      await userBalance.save();

      const embed = new EmbedBuilder()
        .setDescription(responseMessage)
        .setColor(color)
        .setFooter({
          text: `Requested by ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 1024 }),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Error executing eco command:', error);
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setDescription('There was an error processing your request.')
            .setColor('#FF0000') // Red for error
        ]
      });
    }
  },
};
