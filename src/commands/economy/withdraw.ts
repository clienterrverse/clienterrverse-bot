/** @format */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance, Transaction } from '../../schemas/economy.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('withdraw')
      .setDescription(
         'Withdraw a specified amount of clienterr coins from your bank account.'
      )
      .addIntegerOption((option) =>
         option
            .setName('amount')
            .setDescription('The amount to withdraw')
            .setRequired(true)
            .setMinValue(1)
      )
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      const userId = interaction.user.id;
      const amount = interaction.options.getInteger('amount');

      // Fetch or create the user's balance
      let userBalance = await Balance.findOneAndUpdate(
         { userId },
         { $setOnInsert: { balance: 0, bank: 0 } },
         { upsert: true, new: true }
      );

      if (userBalance.bank < amount) {
         return interaction.reply({
            embeds: [
               createErrorEmbed(
                  interaction,
                  'Insufficient Funds',
                  `You only have ${userBalance.bank} clienterr coins in your bank.`
               ),
            ],
            ephemeral: true,
         });
      }

      // Update the user's balance
      userBalance = await Balance.findOneAndUpdate(
         { userId },
         { $inc: { bank: -amount, balance: amount } },
         { new: true }
      );

      // Record the transaction
      await Transaction.create({
         userId,
         type: 'withdraw',
         amount,
      });

      // Create and send the success embed
      const embed = new EmbedBuilder()
         .setTitle('💰 Withdrawal Successful')
         .setDescription(
            `You have withdrawn ${amount} clienterr coins from your bank.`
         )
         .setColor(mconfig.embedColorSuccess)
         .addFields(
            {
               name: '🏦 New Bank Balance',
               value: userBalance.bank.toString(),
               inline: true,
            },
            {
               name: '👛 New Wallet Balance',
               value: userBalance.balance.toString(),
               inline: true,
            }
         )
         .setFooter({
            text: `Withdrawal by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({
               format: 'png',
               dynamic: true,
               size: 1024,
            }),
         })
         .setTimestamp();

      await interaction.reply({ embeds: [embed] });
   },
};

function createErrorEmbed(interaction, title, description) {
   return new EmbedBuilder()
      .setColor(mconfig.embedColorError)
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
