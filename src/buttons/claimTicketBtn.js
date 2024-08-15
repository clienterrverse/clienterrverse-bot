import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
   customId: 'claimTicketBtn',
   userPermissions: [],
   botPermissions: [PermissionFlagsBits.ManageChannels],

   run: async (client, interaction) => {
      try {
         await interaction.deferReply({ ephemeral: true });

         const { member, channel, guild } = interaction;

         const ticketSetup = await ticketSetupSchema
            .findOne({ guildID: guild.id })
            .catch(() => null);
         if (!ticketSetup) {
            return await interaction.editReply(
               'Ticket setup not found. Please configure the ticket system.'
            );
         }

         const staffRoleId = ticketSetup.staffRoleID;
         if (!staffRoleId || !member.roles.cache.has(staffRoleId)) {
            return await interaction.editReply(
               'You do not have the necessary permissions to claim this ticket.'
            );
         }

         const ticket = await ticketSchema
            .findOne({ ticketChannelID: channel.id })
            .catch(() => null);
         if (!ticket) {
            return await interaction.editReply(
               'This channel is not associated with a valid ticket.'
            );
         }

         if (ticket.claimedBy) {
            const claimedMember = await guild.members
               .fetch(ticket.claimedBy)
               .catch(() => null);
            const claimedByText = claimedMember
               ? claimedMember.toString()
               : 'a staff member';
            return await interaction.editReply(
               `This ticket has already been claimed by ${claimedByText}.`
            );
         }

         const permissionUpdates = [
            {
               id: member.id,
               allow: [
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
                  PermissionFlagsBits.ManageChannels,
               ],
            },
            {
               id: guild.roles.everyone.id,
               deny: [PermissionFlagsBits.ViewChannel],
            },
            {
               id: ticket.ticketMemberID,
               allow: [
                  PermissionFlagBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
               ],
            },
            {
               id: staffRoleId,
               deny: [PermissionFlagBits.ViewChannel],
            },
         ];

         await Promise.all(
            permissionUpdates.map(async (update) => {
               try {
                  await channel.permissionOverwrites.edit(
                     update.id,
                     update.allow || update.deny
                  );
               } catch (error) {
                  console.error(
                     `Failed to update permissions for ${update.id}:`,
                     error
                  );
               }
            })
         );

         ticket.claimedBy = member.id;
         await ticket.save().catch((error) => {
            console.error('Failed to save ticket:', error);
            throw new Error('Failed to update ticket information.');
         });

         const claimEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`${member} has claimed this ticket.`)
            .setTimestamp();

         await interaction.deleteReply();
         await channel.send({ embeds: [claimEmbed] }).catch((error) => {
            console.error('Failed to send claim message:', error);
            throw new Error('Failed to send claim notification.');
         });
      } catch (error) {
         console.error('Error claiming ticket:', error);

         if (error.code === 10062) {
            return await interaction
               .followUp({
                  content: 'This interaction has expired. Please try again.',
                  ephemeral: true,
               })
               .catch(console.error);
         }

         const errorMessage =
            error.message ||
            'There was an error claiming the ticket. Please try again later.';
         return await interaction.editReply(errorMessage).catch(console.error);
      }
   },
};
