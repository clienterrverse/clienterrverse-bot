/** @format */
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
   data: new SlashCommandBuilder()
      .setName('bank')
      .setDescription('Your bank balance.')
      .toJSON(),
   userPermissions: [],
   botPermissions: [],
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      try {
         const userId = interaction.user.id;

         let userBalance = await Balance.findOne({ userId });

         if (!userBalance) {
            userBalance = new Balance({ userId });
            await userBalance.save();
         }

         const bankEmbed = new EmbedBuilder()
            .setColor('#0000FF') // Blue color for bank information
            .setTitle('Bank Balance Information')
            .setDescription(`Here is your current bank balance:`)
            .addFields({
               name: 'Bank Balance',
               value: `${userBalance.bank} coins`,
               inline: true,
            })
            .setFooter({
               text: `Requested by ${interaction.user.tag}`,
               iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

         await interaction.reply({ embeds: [bankEmbed] });
      } catch (error) {
         throw error
      }
   },
};