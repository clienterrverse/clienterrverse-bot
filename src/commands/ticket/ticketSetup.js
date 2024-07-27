import {
   SlashCommandBuilder,
   ChannelType,
   PermissionFlagsBits,
   EmbedBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';
import ticketSetupSchema from '../../schemas/ticketSetupSchema.js';

export default {
   data: new SlashCommandBuilder()
      .setName('ticket')
      .setDescription('Manage the ticket system in your server.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
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
            .addChannelOption((option) =>
               option
                  .setName('log-channel')
                  .setDescription('The channel where ticket logs will be sent')
                  .setRequired(true)
                  .addChannelTypes(ChannelType.GuildText)
            )
            .addRoleOption((option) =>
               option
                  .setName('staff-role')
                  .setDescription('The role that will be able to see tickets.')
                  .setRequired(true)
            )
            .addStringOption((option) =>
               option
                  .setName('ticket-type')
                  .setDescription('How tickets will be created')
                  .addChoices(
                     { name: 'Modal', value: 'modal' },
                     { name: 'Button', value: 'button' }
                  )
                  .setRequired(true)
            )
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
      .toJSON(),

   userPermissions: [PermissionFlagsBits.Administrator],
   botPermissions: [
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
   ],
   category: 'ticket',

   run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
         case 'setup':
            await handleSetup(interaction);
            break;
         case 'remove':
            await handleRemove(interaction);
            break;
         case 'status':
            await handleStatus(interaction);
            break;
      }
   },
};

async function handleSetup(interaction) {
   try {
      const { guild, options } = interaction;

      const staffRole = options.getRole('staff-role');
      const ticketChannel = options.getChannel('ticket-channel');
      const category = options.getChannel('category');
      const logChannel = options.getChannel('log-channel');
      const ticketType = options.getString('ticket-type');

      await interaction.deferReply({ ephemeral: true });

      // Validate permissions
      if (
         !ticketChannel
            .permissionsFor(guild.members.me)
            .has(PermissionFlagsBits.SendMessages)
      ) {
         return await interaction.editReply(
            "I don't have permission to send messages in the specified ticket channel."
         );
      }
      if (
         !category
            .permissionsFor(guild.members.me)
            .has(PermissionFlagsBits.ManageChannels)
      ) {
         return await interaction.editReply(
            "I don't have permission to manage channels in the specified category."
         );
      }
      if (
         !logChannel
            .permissionsFor(guild.members.me)
            .has(PermissionFlagsBits.SendMessages)
      ) {
         return await interaction.editReply(
            "I don't have permission to send messages in the specified log channel."
         );
      }

      const ticketCreateEmbed = new EmbedBuilder()
         .setTitle('Support Ticket System')
         .setDescription('Click the button below to create a support ticket.')
         .setColor('Blue')
         .setFooter({ text: 'Support Tickets' })
         .setTimestamp();

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
            { name: 'Ticket Type', value: `${ticketType}`, inline: true }
         )
         .setTimestamp();

      const openTicketButton = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('createTicket')
            .setLabel('Open a ticket')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎫')
      );

      let setupTicket = await ticketSetupSchema.findOne({ guildID: guild.id });

      if (setupTicket) {
         setupTicket.ticketChannelID = ticketChannel.id;
         setupTicket.staffRoleID = staffRole.id;
         setupTicket.ticketType = ticketType;
         setupTicket.categoryID = category.id;
         setupTicket.logChannelID = logChannel.id;
      } else {
         setupTicket = new ticketSetupSchema({
            guildID: guild.id,
            ticketChannelID: ticketChannel.id,
            staffRoleID: staffRole.id,
            ticketType: ticketType,
            categoryID: category.id,
            logChannelID: logChannel.id,
         });
      }

      await setupTicket.save();

      await ticketChannel.send({
         embeds: [ticketCreateEmbed],
         components: [openTicketButton],
      });

      await interaction.editReply({
         content: 'Ticket system setup successful!',
         embeds: [ticketSetupEmbed],
      });
   } catch (error) {
      console.error('Error during ticket setup:', error);
      await interaction.editReply({
         content:
            'There was an error during the ticket setup. Please check my permissions and try again.',
         ephemeral: true,
      });
   }
}

async function handleRemove(interaction) {
   try {
      const { guild } = interaction;

      await interaction.deferReply({ ephemeral: true });

      const setupTicket = await ticketSetupSchema.findOneAndDelete({
         guildID: guild.id,
      });

      if (!setupTicket) {
         return await interaction.editReply({
            content: 'No ticket setup found for this guild.',
            ephemeral: true,
         });
      }

      await interaction.editReply({
         content: 'Ticket system setup has been removed for the guild.',
         ephemeral: true,
      });
   } catch (error) {
      console.error('Error during ticket removal:', error);
      await interaction.editReply({
         content:
            'There was an error during the removal of the ticket setup. Please try again later.',
         ephemeral: true,
      });
   }
}

async function handleStatus(interaction) {
   try {
      const { guild } = interaction;

      await interaction.deferReply({ ephemeral: true });

      const setupTicket = await ticketSetupSchema.findOne({
         guildID: guild.id,
      });

      if (!setupTicket) {
         return await interaction.editReply({
            content: 'No ticket setup found for this guild.',
            ephemeral: true,
         });
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
            { name: 'Ticket Type', value: setupTicket.ticketType, inline: true }
         )
         .setTimestamp();

      await interaction.editReply({
         embeds: [statusEmbed],
      });
   } catch (error) {
      console.error('Error fetching ticket status:', error);
      await interaction.editReply({
         content:
            'There was an error fetching the ticket system status. Please try again later.',
         ephemeral: true,
      });
   }
}
