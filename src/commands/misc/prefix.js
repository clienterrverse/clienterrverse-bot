import { UserPrefix } from '../../schemas/prefix.js';
import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

const DISALLOWED_PREFIXES = [
   '/',
   '\\',
   '@',
   '#',
   '$',
   '&',
   '(',
   ')',
   '{',
   '}',
   '[',
   ']',
];

export default {
   data: new SlashCommandBuilder()
      .setName('prefix')
      .setDescription('Shows or sets your prefix')
      .addStringOption((option) =>
         option
            .setName('prefix')
            .setDescription('The new prefix to set')
            .setRequired(false)
      ),
   userPermissions: [],
   botPermissions: [],
   category: 'Misc',
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      try {
         const newPrefix = interaction.options.getString('prefix');

         if (newPrefix !== null) {
            await updatePrefix(interaction, newPrefix);
         } else {
            await showCurrentPrefix(interaction);
         }
      } catch (error) {
         console.error('Error in prefix command:', error);
         await interaction.reply({
            content:
               'An error occurred while processing the command. Please try again later.',
            ephemeral: true,
         });
      }
   },
};

async function updatePrefix(interaction, newPrefix) {
   if (DISALLOWED_PREFIXES.includes(newPrefix)) {
      return interaction.reply({
         content: `The prefix "${newPrefix}" is not allowed as it may conflict with Discord or bot functionality.`,
         ephemeral: true,
      });
   }

   const finalPrefix = newPrefix === 'noprefix' ? '' : newPrefix;

   await UserPrefix.findOneAndUpdate(
      { userId: interaction.user.id },
      { prefix: finalPrefix },
      { upsert: true }
   );

   await interaction.reply({
      content: `Your prefix has been updated to \`${finalPrefix || 'no prefix'}\`.`,
      ephemeral: true,
   });
}

async function showCurrentPrefix(interaction) {
   const userPrefixData = await UserPrefix.findOne({
      userId: interaction.user.id,
   });
   const userPrefix = userPrefixData ? userPrefixData.prefix : '!';

   const embed = new EmbedBuilder()
      .setTitle('Your Prefix')
      .setDescription(
         `Your current prefix is \`${userPrefix || 'no prefix'}\`. You can set a new prefix by using \`/prefix [newPrefix]\`.`
      )
      .setColor('#00FF00')
      .setFooter({
         text: `Requested by ${interaction.user.tag}`,
         iconURL: interaction.user.avatarURL(),
      })
      .setTimestamp();

   await interaction.reply({ embeds: [embed] });
}
