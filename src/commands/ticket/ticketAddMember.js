import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import Ticket from '../../schemas/ticketSchema.js'; // Use 'Ticket' to match the exported model name

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

    userPermissions: [PermissionFlagsBits.ManageChannels],
    botPermissions: [],

    run: async (client, interaction) => {
        try {
            const { channel, options, guild } = interaction;
            await interaction.deferReply();

            const memberToAdd = options.getUser('member');

            const ticket = await Ticket.findOne({
                guildID: guild.id,
                ticketChannelID: channel.id,
                closed: false
            });

            if (!ticket) {
                return await interaction.editReply({
                    content: 'This channel is not a ticket channel.'
                });
            }

            const memberExistsInServer = guild.members.cache.has(memberToAdd.id);
            if (!memberExistsInServer) {
                return await interaction.editReply({
                    content: 'The member you specified is not in the server.'
                });
            }

            const threadMember = await channel.members.fetch(memberToAdd.id).catch(() => null);

            if (threadMember) {
                return await interaction.editReply({
                    content: 'The member you specified is already in the ticket.'
                });
            }

            ticket.membersAdded.push(memberToAdd.id);
            await ticket.save();

            await channel.members.add(memberToAdd.id);

            return await interaction.editReply({
                content: `Successfully added ${memberToAdd} to the ticket.`,
            });
        } catch (err) {
            console.log(err);
             return await interaction.editReply({
                content: 'An error occurred while adding the member to the ticket.',
            });
        }
    }
};
