import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { Balance } from '../../schemas/economy.js';

export default {
   data: new SlashCommandBuilder()
      .setName('crime')
      .setDescription('Commit a crime and risk it all.'),
   userPermissions: [],
   botPermissions: [],
   cooldown: 20, // 20 seconds cooldown
   nsfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'economy',
   prefix: true,

   run: async (client, interaction) => {
      const userId = interaction.user.id;
      const CrimeCooldown = 6 * 60 * 60 * 1000; // 6 hours in milliseconds
      const MinimumBalanceToCommitCrime = 20; // Minimum balance required to commit a crime

      // Fetch user's balance
      let userBalance = await Balance.findOne({ userId });
      if (!userBalance) {
         userBalance = new Balance({ userId, balance: 0 });
      }

      // Check if the user has enough balance to commit a crime
      if (userBalance.balance < MinimumBalanceToCommitCrime) {
         return interaction.reply(
            `You need at least ${MinimumBalanceToCommitCrime} clienterr coins to commit a crime. Your current balance is ${userBalance.balance} clienterr coins.`
         );
      }

      const now = Date.now();
      if (
         userBalance.lastCrime &&
         now - userBalance.lastCrime.getTime() < CrimeCooldown
      ) {
         const timeLeft =
            CrimeCooldown - (now - userBalance.lastCrime.getTime());
         const minutes = Math.floor(timeLeft / (1000 * 60));
         const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
         return interaction.reply(
            `You have already committed a crime. Please try again in ${minutes} minutes and ${seconds} seconds.`
         );
      }

      // Determine the outcome of the crime
      const crimeOutcome = Math.random() < 0.6; // 60% success rate
      const amount = Math.floor(Math.random() * 30) + 1; // Random amount between 1 and 30

      let crimeMessage = '';
      let color = '';

      if (crimeOutcome) {
         userBalance.balance += amount;
         crimeMessage = `Success! You committed a crime and earned ${amount} clienterr coins. Your balance is now ${userBalance.balance} clienterr coins.`;
         color = '#00FF00'; // Green for success
      } else {
         // Ensure balance doesn't go negative
         userBalance.balance = Math.max(userBalance.balance - amount, 0);
         crimeMessage = `Failure! You got caught and lost ${amount} clienterr coins. Your balance is now ${userBalance.balance} clienterr coins.`;
         color = '#FF0000'; // Red for failure
      }

      // Save the updated balance to the database
      userBalance.lastCrime = new Date();
      await userBalance.save();

      // Create the embed message
      const rEmbed = new EmbedBuilder()
         .setColor(color)
         .setTitle('Crime Commitment')
         .setDescription(crimeMessage);

      // Reply with the embed message
      await interaction.reply({ embeds: [rEmbed] });
   },
};
