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

      const existingTicket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketMemberID: member.id,
        closed: false
      });

      if (existingTicket) {
        return await interaction.reply({
          content: "You already have an open ticket!",
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

        await interaction.showModal(ticketModal);
        return;
      }

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

      const ticketCount = await ticketSchema.countDocuments({
        guildID: guild.id,
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

      const newTicket = new ticketSchema({
        guildID: guild.id,
        ticketMemberID: member.id,
        ticketChannelID: ticketChannel.id,
        parentTicketChannelID: channel.id,
        closed: false,
        membersAdded: [],
        claimedBy: null,
        status: 'open',
        actionLog: [`Ticket created by ${member.user.tag} (${member.id}) at ${new Date().toISOString()}`]
      });

      await newTicket.save();

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor("Green")
          .setTitle("Ticket Created")
          .setDescription(`Ticket created by ${member.user.tag}`)
          .addFields(
            { name: "Ticket Channel", value: `<#${ticketChannel.id}>` },
            { name: "Created At", value: new Date().toISOString() }
          )
          .setTimestamp();

        await logChannel.send({ embeds: [logEmbed] });
      }

      await interaction.reply({
        content: `Your ticket has been created: <#${ticketChannel.id}>`,
        ephemeral: true
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      await interaction.reply({
        content: 'There was an error creating your ticket. Please try again later.',
        ephemeral: true
      });
    }
  }
};
