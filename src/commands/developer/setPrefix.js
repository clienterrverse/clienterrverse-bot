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
      .setName('setprefix')
      .setDescription('Set a prefix for a user or remove it (dev only)')
      .addUserOption((option) =>
         option
            .setName('user')
            .setDescription('The user to set the prefix for')
            .setRequired(true)
      )
      .addStringOption((option) =>
         option
            .setName('prefix')
            .setDescription('The new prefix to set (use "noprefix" to remove)')
            .setRequired(true)
      ),
   userPermissions: [],
   botPermissions: [],
   category: 'Misc',
   cooldown: 5,
   nsfwMode: false,
   testMode: false,
   devOnly: true,
   category: 'Devloper',

   run: async (client, interaction) => {
      try {
         const targetUser = interaction.options.getUser('user');
         const newPrefix = interaction.options.getString('prefix');

         if (!targetUser) {
            return interaction.reply({
               content: 'Please provide a valid user.',
               ephemeral: true,
            });
         }

         await updatePrefix(interaction, targetUser, newPrefix);
      } catch (error) {
         console.error('Error in setprefix command:', error);
         await interaction.reply({
            content:
               'An error occurred while processing the command. Please try again later.',
            ephemeral: true,
         });
      }
   },
};

async function updatePrefix(interaction, targetUser, newPrefix) {
   if (DISALLOWED_PREFIXES.includes(newPrefix) && newPrefix !== 'noprefix') {
      return interaction.reply({
         content: `The prefix "${newPrefix}" is not allowed as it may conflict with Discord or bot functionality.`,
         ephemeral: true,
      });
   }

   const finalPrefix = newPrefix === 'noprefix' ? '' : newPrefix;
   let updateData;
   let responseMessage;

   if (newPrefix === 'noprefix') {
      updateData = { exemptFromPrefix: true, prefix: '' };
      responseMessage = `Prefix for ${targetUser.tag} has been removed and they are now exempt from using a prefix.`;
   } else {
      updateData = { exemptFromPrefix: false, prefix: finalPrefix };
      responseMessage = `Prefix for ${targetUser.tag} has been updated to \`${finalPrefix}\`.`;
   }

   try {
      await UserPrefix.findOneAndUpdate(
         { userId: targetUser.id },
         { $set: { ...updateData, userId: targetUser.id } },
         { upsert: true, new: true, runValidators: true }
      );

      await interaction.reply({
         content: responseMessage,
         ephemeral: true,
      });
   } catch (error) {
      console.error('Error updating prefix:', error);
      await interaction.reply({
         content:
            'An error occurred while updating the prefix. Please try again later.',
         ephemeral: true,
      });
   }
}
