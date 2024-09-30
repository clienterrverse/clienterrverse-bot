import {
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} from 'discord.js';
import ticketSetupSchema from '../../schemas/ticketSetupSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Manage the ticket system in your server.')
    .addSubcommand((subcommand) =>
      subcommand
        .setName('setup')
        .setDescription('Setup or update the ticket system in your server.')
        .addChannelOption((option) =>
          option
            .setName('ticket-channel')
            .setDescription('The channel where tickets will be sent to')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName('category')
            .setDescription('The category where tickets will be created')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildCategory)
        )
        .addRoleOption((option) =>
          option
            .setName('staff-role')
            .setDescription('The role that will be able to see tickets.')
            .setRequired(true)
        )
        .addChannelOption((option) =>
          option
            .setName('log-channel')
            .setDescription('The channel where ticket logs will be sent')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildText)
        )
        .addStringOption((option) =>
          option
            .setName('ticket-type')
            .setDescription('How tickets will be created')
            .addChoices(
              { name: 'Modal', value: 'modal' },
              { name: 'Select', value: 'select' }
            )
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('update')
        .setDescription('Update the ticket system message.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove')
        .setDescription('Remove the ticket system setup for the guild.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('status')
        .setDescription('Check the current ticket system setup.')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('add-option')
        .setDescription('Add a new ticket option.')
        .addStringOption((option) =>
          option
            .setName('label')
            .setDescription('The label for the new ticket option')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('The value for the new ticket option')
            .setRequired(true)
        )
        .addStringOption((option) =>
          option
            .setName('description')
            .setDescription('The description for the new ticket option')
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('remove-option')
        .setDescription('Remove a ticket option.')
        .addStringOption((option) =>
          option
            .setName('value')
            .setDescription('The value of the ticket option to remove')
            .setRequired(true)
        )
    )
    .toJSON(),
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageRoles,
  ],
  category: 'ticket',

  run: async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'setup':
          await handleSetup(interaction);
          break;
        case 'update':
          await handleUpdate(interaction);
          break;
        case 'remove':
          await handleRemove(interaction);
          break;
        case 'status':
          await handleStatus(interaction);
          break;
        case 'add-option':
          await handleAddOption(interaction);
          break;
        case 'remove-option':
          await handleRemoveOption(interaction);
          break;
        default:
          await interaction.reply({
            content: 'Invalid subcommand.',
            ephemeral: true,
          });
      }
    } catch (error) {
      console.error(`Error in ticket command (${subcommand}):`, error);
      await interaction.reply({
        content: 'An error occurred while processing your command.',
        ephemeral: true,
      });
    }
  },
};

async function handleSetup(interaction) {
  const { guild, options } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const staffRole = options.getRole('staff-role');
    const ticketChannel = options.getChannel('ticket-channel');
    const category = options.getChannel('category');
    const logChannel = options.getChannel('log-channel');
    const ticketType = options.getString('ticket-type');

    // Validate permissions
    const requiredPermissions = [
      {
        channel: ticketChannel,
        permission: 'SendMessages',
        name: 'ticket channel',
      },
      { channel: category, permission: 'ManageChannels', name: 'category' },
      {
        channel: logChannel,
        permission: 'SendMessages',
        name: 'log channel',
      },
    ];

    for (const { channel, permission, name } of requiredPermissions) {
      if (
        !channel
          .permissionsFor(guild.members.me)
          .has(PermissionFlagsBits[permission])
      ) {
        return await interaction.editReply(
          `I don't have permission to ${permission} in the specified ${name}.`
        );
      }
    }

    const ticketCreateEmbed = new EmbedBuilder()
      .setTitle('Support Ticket System')
      .setDescription('Create a support ticket')
      .setColor('Blue')
      .setFooter({ text: 'Support Tickets' })
      .setTimestamp();

    let setupTicket = await ticketSetupSchema.findOne({ guildID: guild.id });

    if (!setupTicket) {
      setupTicket = new ticketSetupSchema({
        guildID: guild.id,
        ticketChannelID: ticketChannel.id,
        staffRoleID: staffRole.id,
        categoryID: category.id,
        logChannelID: logChannel.id,
        ticketType: ticketType,
        customOptions: [
          {
            label: 'General Support',
            value: 'general_support',
            description: 'Get help with general issues',
          },
          {
            label: 'Technical Support',
            value: 'technical_support',
            description: 'Get help with technical problems',
          },
        ],
      });
    } else {
      setupTicket.ticketChannelID = ticketChannel.id;
      setupTicket.staffRoleID = staffRole.id;
      setupTicket.categoryID = category.id;
      setupTicket.logChannelID = logChannel.id;
      setupTicket.ticketType = ticketType;
    }

    let component;

    if (ticketType === 'modal') {
      component = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('createTicket')
          .setLabel('Open a ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );
    } else if (ticketType === 'select') {
      component = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('createTicket')
          .setPlaceholder('Select the type of support you need')
          .addOptions(
            setupTicket.customOptions.map((option) => ({
              label: option.label,
              value: option.value,
              description: option.description,
            }))
          )
      );
    } else {
      return interaction.reply('Please select the correct');
    }

    const message = await ticketChannel.send({
      embeds: [ticketCreateEmbed],
      components: [component],
    });

    setupTicket.messageID = message.id;
    await setupTicket.save();

    const ticketSetupEmbed = new EmbedBuilder()
      .setTitle('Ticket System Setup')
      .setColor('Green')
      .setDescription(
        'Ticket system setup complete with the following settings:'
      )
      .addFields(
        { name: 'Ticket Channel', value: `${ticketChannel}`, inline: true },
        { name: 'Category', value: `${category}`, inline: true },
        { name: 'Log Channel', value: `${logChannel}`, inline: true },
        { name: 'Staff Role', value: `${staffRole}`, inline: true },
        {
          name: 'Ticket Type',
          value: ticketType.charAt(0).toUpperCase() + ticketType.slice(1),
          inline: true,
        },
        { name: 'Message ID', value: message.id, inline: true }
      )
      .setTimestamp();

    await interaction.editReply({
      content: 'Ticket system setup successful!',
      embeds: [ticketSetupEmbed],
    });
  } catch (error) {
    console.error('Error during ticket setup:', error);
    await interaction.editReply(
      'There was an error during the ticket setup. Please check my permissions and try again.'
    );
  }
}
async function handleUpdate(interaction) {
  const { guild } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const setupTicket = await ticketSetupSchema.findOne({
      guildID: guild.id,
    });
    if (!setupTicket) {
      return await interaction.editReply(
        'No ticket setup found for this guild. Please set up the ticket system first.'
      );
    }

    const ticketChannel = await guild.channels.cache.get(
      setupTicket.ticketChannelID
    );
    if (!ticketChannel) {
      return await interaction.editReply(
        'The ticket channel no longer exists. Please set up the ticket system again.'
      );
    }

    let ticketMessage;
    try {
      ticketMessage = await ticketChannel.messages.cache.get(
        setupTicket.messageID
      );
    } catch (error) {
      return await interaction.editReply(
        'Unable to find the ticket system message. It may have been deleted. Please set up the ticket system again.'
      );
    }

    const ticketCreateEmbed = new EmbedBuilder()
      .setTitle('Support Ticket System')
      .setDescription('Create a support ticket')
      .setColor('Blue')
      .setFooter({ text: 'Support Tickets' })
      .setTimestamp();

    let component;

    if (ticketType === 'modal') {
      component = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('createTicket')
          .setLabel('Open a ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );
    } else if (ticketType === 'select') {
      component = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('createTicket')
          .setPlaceholder('Select the type of support you need')
          .addOptions(
            setupTicket.customOptions.map((option) => ({
              label: option.label,
              value: option.value,
              description: option.description,
            }))
          )
      );
    } else {
      return interaction.reply('Please select the correct');
    }

    await ticketMessage.edit({
      embeds: [ticketCreateEmbed],
      components: [component],
    });

    const updateEmbed = new EmbedBuilder()
      .setTitle('Ticket System Updated')
      .setColor('Green')
      .setDescription(
        'The ticket system message has been updated with the current settings.'
      )
      .addFields(
        { name: 'Message ID', value: setupTicket.messageID, inline: true },
        {
          name: 'Ticket Channel',
          value: `<#${setupTicket.ticketChannelID}>`,
          inline: true,
        },
        {
          name: 'Ticket Type',
          value:
            setupTicket.ticketType.charAt(0).toUpperCase() +
            setupTicket.ticketType.slice(1),
          inline: true,
        }
      )
      .setTimestamp();

    await interaction.editReply({
      content: 'Ticket system message updated successfully!',
      embeds: [updateEmbed],
    });
  } catch (error) {
    console.error('Error during ticket update:', error);
    await interaction.editReply(
      'There was an error during the ticket system update. Please try again.'
    );
  }
}
async function handleRemove(interaction) {
  const { guild } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const setupTicket = await ticketSetupSchema.findOneAndDelete({
      guildID: guild.id,
    });

    if (!setupTicket) {
      return await interaction.editReply(
        'No ticket setup found for this guild.'
      );
    }

    const ticketChannel = await guild.channels.cache.get(
      setupTicket.ticketChannelID
    );
    if (ticketChannel) {
      try {
        const ticketMessage = await ticketChannel.messages.cache.get(
          setupTicket.messageID
        );
        if (ticketMessage) {
          await ticketMessage.delete();
        }
      } catch (error) {
        console.error('Error deleting ticket message:', error);
      }
    }

    await interaction.editReply(
      'Ticket system setup has been removed for the guild and the ticket message has been deleted.'
    );
  } catch (error) {
    console.error('Error during ticket removal:', error);
    await interaction.editReply(
      'There was an error during the removal of the ticket setup. Please try again later.'
    );
  }
}
async function handleStatus(interaction) {
  const { guild } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const setupTicket = await ticketSetupSchema.findOne({
      guildID: guild.id,
    });

    if (!setupTicket) {
      return await interaction.editReply(
        'No ticket setup found for this guild.'
      );
    }

    const statusEmbed = new EmbedBuilder()
      .setTitle('Ticket System Status')
      .setColor('Blue')
      .setDescription('Current ticket system configuration:')
      .addFields(
        {
          name: 'Ticket Channel',
          value: `<#${setupTicket.ticketChannelID}>`,
          inline: true,
        },
        {
          name: 'Category',
          value: `<#${setupTicket.categoryID}>`,
          inline: true,
        },
        {
          name: 'Log Channel',
          value: `<#${setupTicket.logChannelID}>`,
          inline: true,
        },
        {
          name: 'Staff Role',
          value: `<@&${setupTicket.staffRoleID}>`,
          inline: true,
        },
        {
          name: 'Ticket Type',
          value:
            setupTicket.ticketType.charAt(0).toUpperCase() +
            setupTicket.ticketType.slice(1),
          inline: true,
        },
        { name: 'Message ID', value: setupTicket.messageID, inline: true }
      )
      .addField(
        'Custom Options',
        setupTicket.customOptions
          .map((option) => `${option.label} (${option.value})`)
          .join('\n')
      )
      .setTimestamp();

    await interaction.editReply({ embeds: [statusEmbed] });
  } catch (error) {
    console.error('Error fetching ticket status:', error);
    await interaction.editReply(
      'There was an error fetching the ticket system status. Please try again later.'
    );
  }
}

async function handleAddOption(interaction) {
  const { guild, options } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const label = options.getString('label');
    const value = options.getString('value');
    const description = options.getString('description');

    const setupTicket = await ticketSetupSchema.findOne({
      guildID: guild.id,
    });
    if (!setupTicket) {
      return await interaction.editReply(
        'No ticket setup found for this guild. Please set up the ticket system first.'
      );
    }

    if (setupTicket.customOptions.some((option) => option.value === value)) {
      return await interaction.editReply(
        'An option with this value already exists.'
      );
    }

    const existingLabel = setupTicket.customOptions.find(
      (opt) => opt.label === label
    );
    if (existingLabel) {
      return await interaction.editReply({
        content: `The label "${label}" already exists.`,
        ephemeral: true,
      });
    }

    setupTicket.customOptions.push({ label, value, description });

    // Update the ticket channel message
    const ticketChannel = await guild.channels.cache.get(
      setupTicket.ticketChannelID
    );
    if (ticketChannel) {
      const ticketMessage = await ticketChannel.messages.cache.get(
        setupTicket.messageID
      );
      if (ticketMessage) {
        const component = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('createTicket')
            .setPlaceholder('Select the type of support you need')
            .addOptions(
              setupTicket.customOptions.map((option) => ({
                label: option.label,
                value: option.value,
                description: option.description,
              }))
            )
        );
        await ticketMessage.edit({
          components: [component],
        });
      }
    }

    await setupTicket.save();

    const successEmbed = new EmbedBuilder()
      .setTitle('Label Added')
      .setDescription(
        `The label "${label}" (${value}) has been added successfully.`
      )
      .setColor('Green')
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error adding label:', error);
    await interaction.editReply({
      content: 'There was an error adding the label. Please try again later.',
      ephemeral: true,
    });
  }
}

async function handleRemoveOption(interaction) {
  const { guild, options } = interaction;

  await interaction.deferReply({ ephemeral: true });

  try {
    const value = options.getString('value');

    const setupTicket = await ticketSetupSchema.findOne({
      guildID: guild.id,
    });
    if (!setupTicket) {
      return await interaction.editReply(
        'No ticket setup found for this guild. Please set up the ticket system first.'
      );
    }

    const optionIndex = setupTicket.customOptions.findIndex(
      (option) => option.value === value
    );
    if (optionIndex === -1) {
      return await interaction.editReply(
        'No option with the provided value exists.'
      );
    }

    const removedOption = setupTicket.customOptions.splice(optionIndex, 1)[0];

    // Update the ticket channel message
    const ticketChannel = await guild.channels.cache.get(
      setupTicket.ticketChannelID
    );
    if (ticketChannel) {
      const ticketMessage = await ticketChannel.messages.cache.get(
        setupTicket.messageID
      );
      if (ticketMessage) {
        const component = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('createTicket')
            .setPlaceholder('Select the type of support you need')
            .addOptions(
              setupTicket.customOptions.map((option) => ({
                label: option.label,
                value: option.value,
                description: option.description,
              }))
            )
        );
        await ticketMessage.edit({
          components: [component],
        });
      }
    }

    await setupTicket.save();

    const successEmbed = new EmbedBuilder()
      .setTitle('Option Removed')
      .setDescription(
        `The option "${removedOption.label}" (${removedOption.value}) has been removed.`
      )
      .setColor('Green')
      .setTimestamp();

    await interaction.editReply({ embeds: [successEmbed] });
  } catch (error) {
    console.error('Error removing option:', error);
    await interaction.editReply({
      content:
        'There was an error removing the option. Please try again later.',
      ephemeral: true,
    });
  }
}
