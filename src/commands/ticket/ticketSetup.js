import { 
  SlashCommandBuilder,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import ticketSetupSchema from '../../schemas/ticketSetupSchema.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ticket-setup')
    .setDescription('Setup a ticket system in your server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option => 
      option.setName('ticket-channel')
        .setDescription('The channel where tickets will be sent to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .addChannelOption(option => 
      option.setName('category')
        .setDescription('The category where tickets will be created')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildCategory))
    .addChannelOption(option => 
      option.setName('log-channel')
        .setDescription('The channel where ticket logs will be sent')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .addRoleOption(option => 
      option.setName('staff-role')
        .setDescription('The role that will be able to see tickets.')
        .setRequired(true))
    .addStringOption(option => 
      option.setName('ticket-type')
        .setDescription('Whether tickets will be sent as buttons or modals')
        .addChoices(
          { name: 'Modal', value: 'modal' },
          { name: 'Button', value: 'button' }
        )
        .setRequired(true))
    .toJSON(),
  
  userPermissions: [PermissionFlagsBits.Administrator],
  botPermissions: [],
  
  run: async (client, interaction) => {
    try {
      const { guild, options } = interaction;

      const staffRole = options.getRole('staff-role');
      const ticketChannel = options.getChannel('ticket-channel');
      const category = options.getChannel('category');
      const logChannel = options.getChannel('log-channel');
      const ticketType = options.getString('ticket-type');

      await interaction.deferReply({ ephemeral: true });

      const ticketCreateEmbed = new EmbedBuilder()
        .setTitle('Ticket System')
        .setDescription('Click the button below to create a ticket.')
        .setColor('Blue')
        .setFooter({ text: 'Support Tickets' })
        .setTimestamp();

      const ticketSetupEmbed = new EmbedBuilder()
        .setTitle('Ticket System Setup')
        .setColor('DarkGreen')
        .setDescription('Ticket system setup complete with the following settings:')
        .addFields(
          { name: 'Ticket Channel', value: `${ticketChannel}`, inline: true },
          { name: 'Category', value: `${category}`, inline: true },
          { name: 'Log Channel', value: `${logChannel}`, inline: true },
          { name: 'Staff Role', value: `${staffRole}`, inline: true },
          { name: 'Ticket Type', value: `${ticketType}`, inline: true }
        )
        .setTimestamp();

      const openTicketButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('supportTicketBtn')
          .setLabel('Open a ticket')
          .setStyle(ButtonStyle.Secondary)
      );

      let setupTicket = await ticketSetupSchema.findOne({ ticketChannelID: ticketChannel.id });

      if (setupTicket) {
        return await interaction.editReply({
          content: 'This channel is already registered as a ticket channel.',
        });
      } 

      setupTicket = await ticketSetupSchema.create({
        guildID: guild.id,
        ticketChannelID: ticketChannel.id,
        staffRoleID: staffRole.id,
        ticketType: ticketType,
        categoryID: category.id,
        logChannelID: logChannel.id,
      });

      await setupTicket.save();

      await ticketChannel.send({
        embeds: [ticketCreateEmbed],
        components: [openTicketButton],
      });

      await interaction.editReply({
        embeds: [ticketSetupEmbed],
      });
      

    } catch (error) {
      console.error('Error during ticket setup:', error);
      await interaction.editReply({
        content: 'There was an error during the ticket setup. Please try again later.',
        ephemeral: true,
      });
    }
  }
};
