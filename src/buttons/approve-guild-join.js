/**
 * Handles the approval of a guild join request.
 *
 * This function is triggered by the 'approve-guild-join' custom button. It retrieves the original message,
 * extracts the user ID from the embed, finds the user in the pending members list, adds them to the guild members,
 * removes them from the pending list, updates the original message, and notifies the user.
 *
 * @param {Discord.Client} client - The Discord client instance.
 * @param {Discord.Interaction} interaction - The interaction object.
 */
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import Guild from '../schemas/guildSchema.js'; // Adjust the import path as needed

export default {
  /**
   * The custom ID of the button.
   * @type {string}
   */
  customId: 'approve-guild-join',
  /**
   * The required permissions for the user to execute this action.
   * @type {Array<string>}
   */
  userPermissions: [PermissionFlagsBits.ManageGuild],
  /**
   * The required permissions for the bot to execute this action.
   * @type {Array<string>}
   */
  botPermissions: [PermissionFlagsBits.ManageRoles],
  /**
   * Executes the guild join request approval process.
   *
   * @param {Discord.Client} client - The Discord client instance.
   * @param {Discord.Interaction} interaction - The interaction object.
   */
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
