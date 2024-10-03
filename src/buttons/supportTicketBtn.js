import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';
import ticketSchema from '../schemas/ticketSchema.js';

export default {
  customId: 'createTicket',
  userPermissions: [],
  botPermissions: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
  ],

  run: async (client, interaction) => {
    try {
      const { channel, guild, member } = interaction;

      // Fetch ticket setup
      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id,
      });

      if (!ticketSetup) {
        return await interaction.reply({
          content:
            'The ticket system has not been set up yet. Please contact an administrator to set it up.',
          ephemeral: true,
        });
      }

      // Check for existing open ticket
      const existingTicket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketMemberID: member.id,
        closed: false,
      });

      if (existingTicket) {
        return await interaction.reply({
          content: `You already have an open ticket! Please use <#${existingTicket.ticketChannelID}>.`,
          ephemeral: true,
        });
      }

      // Handle modal ticket creation
      if (ticketSetup.ticketType === 'modal') {
        return await handleModalTicket(interaction);
      }

      // Handle button ticket creation
      await handleButtonTicket(interaction, ticketSetup);
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content:
          'There was an error creating your ticket. Please try again later.',
        ephemeral: true,
      });
    }
  },
};

async function handleModalTicket(interaction) {
  const ticketModal = new ModalBuilder()
    .setTitle('Create a Support Ticket')
    .setCustomId('ticketModal')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setLabel('Ticket Subject')
          .setCustomId('ticketSubject')
          .setPlaceholder('Enter a subject for your ticket')
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setLabel('Ticket Description')
          .setCustomId('ticketDesc')
          .setPlaceholder('Describe your issue in detail')
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
      )
    );

  await interaction.showModal(ticketModal);
}

async function handleButtonTicket(interaction, ticketSetup) {
  const { guild, member } = interaction;

  const category = await guild.channels.fetch(ticketSetup.categoryID);
  if (!category) {
    return await interaction.reply({
      content:
        'The ticket category no longer exists. Please contact an administrator.',
      ephemeral: true,
    });
  }

  const staffRole = await guild.roles.fetch(ticketSetup.staffRoleID);
  if (!staffRole) {
    return await interaction.reply({
      content:
        'The staff role no longer exists. Please contact an administrator.',
      ephemeral: true,
    });
  }

  const ticketCount = await ticketSchema.countDocuments({
    guildID: guild.id,
  });

  const ticketChannel = await createTicketChannel(
    guild,
    category,
    member,
    staffRole,
    ticketCount
  );

  const ticketEmbed = createTicketEmbed(member, guild);
  const ticketActions = createTicketActions();

  await ticketChannel.send({
    content: `${staffRole} - New ticket created by ${member}`,
    embeds: [ticketEmbed],
    components: [ticketActions],
  });

  const newTicket = await createTicketDocument(
    guild,
    member,
    ticketChannel,
    interaction.channel
  );

  await interaction.reply({
    content: `Your ticket has been created: <#${ticketChannel.id}>`,
    ephemeral: true,
  });

  // Log ticket creation
  if (ticketSetup.logChannelID) {
    const logChannel = await guild.channels.fetch(ticketSetup.logChannelID);
    if (logChannel) {
      await logChannel.send(
        `New ticket created by ${member.user.tag} (${member.id}) - <#${ticketChannel.id}>`
      );
    }
  }
}

async function createTicketChannel(
  guild,
  category,
  member,
  staffRole,
  ticketCount
) {
  return await guild.channels.create({
    name: `ticket-${ticketCount + 1}-${member.user.username}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: member.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: staffRole.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ],
  });
}

function createTicketEmbed(member, guild) {
  return new EmbedBuilder()
    .setColor('DarkNavy')
    .setAuthor({
      name: member.user.username,
      iconURL: member.user.displayAvatarURL(),
    })
    .setTitle('New Support Ticket')
    .setDescription(
      'A staff member will be with you shortly. Please explain your issue in as much detail as possible.'
    )
    .addFields(
      { name: 'Ticket Creator', value: member.toString(), inline: true },
      {
        name: 'Created At',
        value: new Date().toLocaleString(),
        inline: true,
      }
    )
    .setFooter({
      text: `${guild.name} - Support Ticket`,
      iconURL: guild.iconURL(),
    })
    .setTimestamp();
}

function createTicketActions() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('closeTicket')
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('claimTicket')
      .setLabel('Claim Ticket')
      .setStyle(ButtonStyle.Primary)
  );
}

async function createTicketDocument(
  guild,
  member,
  ticketChannel,
  parentChannel
) {
  const newTicket = new ticketSchema({
    guildID: guild.id,
    ticketMemberID: member.id,
    ticketChannelID: ticketChannel.id,
    parentTicketChannelID: parentChannel.id,
    closed: false,
    membersAdded: [],
    claimedBy: null,
    status: 'open',
    actionLog: [
      `Ticket created by ${member.user.tag} (${member.id}) at ${new Date().toISOString()}`,
    ],
  });

  return await newTicket.save();
}
