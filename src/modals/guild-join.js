import {
   EmbedBuilder,
   ButtonBuilder,
   ActionRowBuilder,
   ButtonStyle,
} from 'discord.js';
import Guild from '../schemas/guildSchema.js';

export default {
   customId: 'guild-join',
   userPermissions: [],
   botPermissions: [],
   run: async (client, interaction) => {
      try {
         const ign = interaction.fields.getTextInputValue('ign');
         const reason = interaction.fields.getTextInputValue('reason');

         // Find the guild
         const guild = await Guild.findOne();
         if (!guild) {
            return interaction.reply({
               content: 'The guild has not been set up yet.',
               ephemeral: true,
            });
         }

         // Check if user is already a member or has a pending request
         const isExistingMember = guild.members.some(
            (member) => member.userId === interaction.user.id
         );
         const hasPendingRequest = guild.pendingMembers.some(
            (member) => member.userId === interaction.user.id
         );

         if (isExistingMember || hasPendingRequest) {
            return interaction.reply({
               content:
                  'You are already a member or have a pending request for this guild.',
               ephemeral: true,
            });
         }

         const approvalChannel = interaction.client.channels.cache.get(
            guild.approvalChannelId
         );
         if (!approvalChannel) {
            return interaction.reply({
               content: 'The approval channel has not been set up correctly.',
               ephemeral: true,
            });
         }

         const embed = new EmbedBuilder()
            .setTitle('New Guild Join Request')
            .setColor('#0099ff')
            .addFields(
               { name: 'User', value: `<@${interaction.user.id}>` },
               { name: 'Hypixel IGN', value: ign },
               { name: 'Reason', value: reason }
            )
            .setTimestamp();

         const approveButton = new ButtonBuilder()
            .setCustomId('approve-guild-join')
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success);

         const denyButton = new ButtonBuilder()
            .setCustomId('deny-guild-join')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

         const row = new ActionRowBuilder().addComponents(
            approveButton,
            denyButton
         );

         const approvalMessage = await approvalChannel.send({
            embeds: [embed],
            components: [row],
         });

         guild.pendingMembers.push({
            userId: interaction.user.id,
            ign: ign,
            reason: reason,
            messageId: approvalMessage.id,
            appliedDate: new Date(),
         });

         await guild.save();

         return interaction.reply({
            content:
               'Your request to join the guild has been sent to the admins for approval.',
            ephemeral: true,
         });
      } catch (error) {
         console.error(error);
         return interaction.reply({
            content: 'An error occurred while processing your request.',
            ephemeral: true,
         });
      }
   },
};
