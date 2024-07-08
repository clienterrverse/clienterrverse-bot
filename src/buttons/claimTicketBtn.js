import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';

export default {
   customId: 'claimTicketBtn',
   userPermissions: [],
   botPermissions: [PermissionFlagsBits.ManageChannels],

   run: async (client, interaction) => {
      await interaction.deferReply({ ephemeral: true });

      try {
         const { member, channel, guild } = interaction;

         const ticketSetup = await ticketSetupSchema.findOne({
            guildID: guild.id,
         });
         if (!ticketSetup) {
            return await interaction.editReply('Ticket setup not found.');
         }

         const staffRoleId = ticketSetup.staffRoleID;
         if (!member.roles.cache.has(staffRoleId)) {
            return await interaction.editReply(
               'You do not have the necessary permissions to claim this ticket.'
            );
         }

         const ticket = await ticketSchema.findOne({
            ticketChannelID: channel.id,
         });
         if (!ticket) {
            return await interaction.editReply('Ticket not found.');
         }

         if (ticket.claimedBy) {
            return await interaction.editReply(
               `This ticket has already been claimed by <@${ticket.claimedBy}>.`
            );
         }

         // Update channel permissions
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
                  PermissionFlagsBits.ViewChannel,
                  PermissionFlagsBits.SendMessages,
               ],
            },
            { id: staffRoleId, deny: [PermissionFlagsBits.ViewChannel] },
         ];

         await Promise.all(
            permissionUpdates.map((update) =>
               channel.permissionOverwrites.edit(
                  update.id,
                  update.allow || update.deny
               )
            )
         );

         // Update ticket status in the database
         ticket.claimedBy = member.id;
         await ticket.save();

         const claimEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`${member} has claimed this ticket.`)
            .setTimestamp();

         await interaction.deleteReply();
         return await channel.send({ embeds: [claimEmbed] });
      } catch (error) {
         console.error('Error claiming ticket:', error);

         if (error.code === 10062) {
            return await interaction.followUp({
               content: 'This interaction has expired. Please try again.',
               ephemeral: true,
            });
         }

         return await interaction.editReply(
            'There was an error claiming the ticket. Please try again later.'
         );
      }
   },
};
