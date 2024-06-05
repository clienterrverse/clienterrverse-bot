import {
  ModalBuilder,
  ActionRowBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits
} from "discord.js";
import ticketSetupSchema from "../schemas/ticketSetupSchema.js";
import ticketSchema from "../schemas/ticketSchema.js";

export default {
  customId: "supportTicketBtn",
  userPermissions: [],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { channel, guild, member } = interaction;

      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id
      });

      if (!ticketSetup) {
        return await interaction.reply({
          content: "The ticket system has not been set up yet. Please contact an administrator to set it up.",
          ephemeral: true
        });
      }

      if (ticketSetup.ticketType === "modal") {
        const ticketModal = new ModalBuilder()
          .setTitle("Ticket System")
          .setCustomId("ticketModal")
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Ticket Subject")
                .setCustomId("ticketSubject")
                .setPlaceholder("Enter a subject for your ticket")
                .setStyle(TextInputStyle.Short)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setLabel("Ticket Description")
                .setCustomId("ticketDesc")
                .setPlaceholder("Enter a description for your ticket")
                .setStyle(TextInputStyle.Paragraph)
            )
          );
        return interaction.showModal(ticketModal);
      } else {
        await interaction.deferReply({ ephemeral: true });

        const category = guild.channels.cache.get(ticketSetup.categoryID);
        const logChannel = guild.channels.cache.get(ticketSetup.logChannelID);
        const staffRole = guild.roles.cache.get(ticketSetup.staffRoleID);
        const username = member.user.username;

        const ticketEmbed = new EmbedBuilder()
          .setColor("DarkNavy")
          .setAuthor({ name: username, iconURL: member.user.displayAvatarURL() })
          .setTitle("Ticket Created")
          .setDescription("Staff will be with you shortly. Please explain your issue in as much detail as possible.")
          .setFooter({
            text: `${guild.name} - Ticket`,
            iconURL: guild.iconURL()
          })
          .setTimestamp();

        let ticket = await ticketSchema.findOne({
          guildID: guild.id,
          ticketMemberID: member.id,
          parentTicketChannelID: channel.id,
          closed: false
        });

        if (ticket) {
          return await interaction.editReply({
            content: "You already have an open ticket.",
            ephemeral: true
          });
        }

        const ticketCount = await ticketSchema.countDocuments({
          guildID: guild.id,
          parentTicketChannelID: channel.id,
          closed: true
        });

        const ticketChannel = await guild.channels.create({
          name: `${ticketCount + 1}-${username}`,
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: guild.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: member.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: staffRole.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });

        await ticketChannel.send({
          content: `${staffRole} - Ticket created by ${member}`,
          embeds: [ticketEmbed]
        });

        ticket = await ticketSchema.create({
          guildID: guild.id,
          ticketMemberID: member.id,
          ticketChannelID: ticketChannel.id,
          parentTicketChannelID: channel.id,
          closed: false,
          membersAdded: [],
          claimedBy: null, // Initially, no one has claimed the ticket
          status: 'open',
          actionLog: [`Ticket created by ${member.user.tag}`] // Initial action log entry
        });

        await ticket.save();

        return await interaction.editReply({
          content: `Your ticket has been created in ${ticketChannel}`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: 'There was an error creating your ticket. Please try again later.',
        ephemeral: true
      });
    }
  }
};
