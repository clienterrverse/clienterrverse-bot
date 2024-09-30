import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import Guild from '../schemas/guildSchema.js'; // Adjust the import path as needed

export default {
  customId: 'deny-guild-join',
  userPermissions: [PermissionFlagsBits.ManageGuild],
  botPermissions: [PermissionFlagsBits.ManageRoles],
  run: async (client, interaction) => {
    try {
      const { guild, member } = interaction;

      // Find the guild document
      const guildData = await Guild.findOne({ guildId: guild.id });
      if (!guildData) {
        return interaction.reply({
          content: 'Guild data not found.',
          ephemeral: true,
        });
      }

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

      // Remove from pending members
      guildData.pendingMembers = guildData.pendingMembers.filter(
        (pm) => pm.userId !== userId
      );
      await guildData.save();

      // Update the original message
      const updatedEmbed = EmbedBuilder.from(embed)
        .setColor('Red')
        .setTitle('Guild Join Request Denied')
        .addFields({ name: 'Denied by', value: member.user.tag });

      await message.edit({ embeds: [updatedEmbed], components: [] });

      // Notify the user
      const user = await client.users.fetch(userId);
      await user
        .send('Your request to join the guild has been denied.')
        .catch(() => {});

      return interaction.reply({
        content: 'Guild join request denied successfully.',
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      return interaction.reply({
        content: 'An error occurred while processing the denial.',
        ephemeral: true,
      });
    }
  },
};
