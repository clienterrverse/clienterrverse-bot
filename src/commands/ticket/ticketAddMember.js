import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js'; // Ensure correct import of the Ticket schema

export default {
    data: new SlashCommandBuilder()
        .setName('ticket-add-member')
        .setDescription('Add a member to a ticket.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addUserOption(option =>
            option.setName('member')
                .setDescription('The member to add to the ticket.')
                .setRequired(true))
        .toJSON(),

    userPermissions: [],
    botPermissions: [],

    run: async (client, interaction) => {
        try {
            const { channel, options, guild } = interaction;
            await interaction.deferReply({ ephemeral: true });

            const memberToAdd = options.getUser('member');

            const ticket = await Ticket.findOne({
                guildID: guild.id,
                ticketChannelID: channel.id,
                closed: false
            });

            if (!ticket) {
                return await interaction.editReply({
                    content: 'This channel is not a ticket channel.',
                    ephemeral: true
                });
            }

            const memberExistsInServer = guild.members.cache.has(memberToAdd.id);
            if (!memberExistsInServer) {
                return await interaction.editReply({
                    content: 'The member you specified is not in the server.',
                    ephemeral: true
                });
            }

            const threadMember = await guild.members.fetch(memberToAdd.id).catch(() => null);

            if (threadMember && channel.permissionOverwrites.cache.has(memberToAdd.id)) {
                return await interaction.editReply({
                    content: 'The member you specified is already in the ticket.',
                    ephemeral: true
                });
            }

            ticket.membersAdded.push(memberToAdd.id);
            await ticket.save();

            await channel.permissionOverwrites.create(memberToAdd.id, {
                ViewChannel: true,
                SendMessages: true
            });

            return await interaction.editReply({
                content: `Successfully added ${memberToAdd.tag} to the ticket.`,
                ephemeral: true
            });
        } catch (err) {
            console.error('Error adding member to ticket:', err); // Improved error logging
            return await interaction.editReply({
                content: 'An error occurred while adding the member to the ticket.',
                ephemeral: true
            });
        }
    }
};
