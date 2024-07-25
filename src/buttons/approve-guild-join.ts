import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import Guild from '../schemas/guildSchema.js'; // Adjust the import path as needed

export default {
   customId: 'approve-guild-join',
   userPermissions: [PermissionFlagsBits.ManageGuild],
   botPermissions: [PermissionFlagsBits.ManageRoles],
   run: async (client, interaction) => {
      try {
         const { guild, member } = interaction;

         // Get the original message
         const message = interaction.message;
         const embed = message.embeds[0];

         // Extract user ID from the embed
         const userField = embed.fields.find((field) => field.name === 'User');
         const userId = userField.value.match(/\d+/)[0];

         // Find the user in pending members
         const pendingMember = guildData.pendingMembers.find(
            (pm) => pm.userId === userId
         );
         if (!pendingMember) {
            return interaction.reply({
               content: 'This user is no longer in the pending list.',
               ephemeral: true,
            });
         }

         // Add user to guild members and remove from pending
         guildData.members.push(userId);
         guildData.pendingMembers = guildData.pendingMembers.filter(
            (pm) => pm.userId !== userId
         );
         await guildData.save();

         // Update the original message
         const updatedEmbed = EmbedBuilder.from(embed)
            .setColor('Green')
            .setTitle('Guild Join Request Approved')
            .addFields({ name: 'Approved by', value: member.user.tag });

         await message.edit({ embeds: [updatedEmbed], components: [] });

         // Notify the user
         const user = await client.users.fetch(userId);
         await user
            .send('Your request to join the guild has been approved!')
            .catch(() => {});

         return interaction.reply({
            content: 'Guild join request approved successfully.',
            ephemeral: true,
         });
      } catch (error) {
         console.error(error);
         return interaction.reply({
            content: 'An error occurred while processing the approval.',
            ephemeral: true,
         });
      }
   },
};
