import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } from'discord.js';
import ticketSetupSchema from'../schemas/ticketSetupSchema.js';
import  ticketSchema from'../schemas/ticketSchema.js';

export default {
  customId: 'ticketModal',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    const { fields, guild, member, channel } = interaction;

    // Retrieve values from the modal
    const subject = fields.getTextInputValue('ticketSubject');
    const description = fields.getTextInputValue('ticketDesc');

    await interaction.deferReply({ ephemeral: true });

    // Fetch ticket setup configuration from the database
    const ticketSetup = await ticketSetupSchema.findOne({
      guildID: guild.id,
      ticketChannelID: channel.id,
    });

    if (!ticketSetup) {
      return await interaction.editReply({
        content: 'Ticket setup not found.',
      });
    }

    // Get the ticket channel and staff role
    const ticketChannel = guild.channels.cache.find(ch => ch.id === ticketSetup.ticketChannelID);
    const staffRole = guild.roles.cache.get(ticketSetup.staffRoleID);
    const username = member.user.username;

    // Create the ticket embed
    const ticketEmbed = new EmbedBuilder()
      .setColor('#9861FF')
      .setAuthor({ name: username, iconURL: member.displayAvatarURL({ dynamic: true }) })
      .setDescription(`**Subject:** ${subject}\n**Description:** ${description}`)
      .setFooter({
        text: `${guild.name} - Ticket`,
        iconURL: guild.iconURL(),
      })
      .setTimestamp();

    // Create action row with buttons
    const ticketButtons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('closeTicketBtn')
        .setLabel('Close Ticket')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('lockTicketBtn')
        .setLabel('Lock Ticket')
        .setStyle(ButtonStyle.Success),
    );

    // Check if there is an open ticket
    let ticket = await ticketSchema.findOne({
      guildID: guild.id,
      ticketMemberID: member.id,
      parentTicketChannelID: channel.id,
      closed: false,
    });

    const ticketCount = await ticketSchema.find({
      guildID: guild.id,
      ticketMemberID: member.id,
      parentTicketChannelID: channel.id,
      closed: true,
    }).countDocuments();

    if (ticket) {
      return await interaction.editReply({
        content: `You already have an open ticket! <#${ticket.parentTicketChannelID}>`,
      });
    }

    // Create a new private thread for the ticket
    const thread = await ticketChannel.threads.create({
      name: `${ticketCount + 1} - ${username}`,
      type: ChannelType.PrivateThread,
    });

    await thread.send({
      content: `${staffRole} - Ticket created by ${username}`,
      embeds: [ticketEmbed],
      components: [ticketButtons],
    });

    if (!ticket) {
      ticket = await ticketSchema.create({
        guildID: guild.id,
        ticketMemberID: member.id,
        ticketChannelID: thread.id,
        parentTicketChannelID: channel.id,
        closed: false,
        membersAdded: [],
      });
    }

    return await interaction.editReply({
      content: `Your ticket has been created in ${thread}`,
    });
  },
};
