import { PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ticketSchema from '../schemas/ticketSchema.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';
import axios from 'axios'; // Import axios for GitHub interaction
import dht from "discord-html-transcripts";

export default {
  customId: 'closeTicketModal',
  userPermissions: [],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { channel, member, guild, fields } = interaction;

      await interaction.deferReply({ ephemeral: true });

      const reason = fields.getTextInputValue('closeTicketReason') || 'No reason provided';

      const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

      if (!ticket) {
        return await interaction.editReply({
          content: 'Ticket not found.',
          ephemeral: true,
        });
      }

      ticket.status = 'closed';
      ticket.closedBy = member.id;
      ticket.reason = reason;
      ticket.actionLog.push(`Ticket closed by ${member.user.tag} at ${new Date().toISOString()}: ${reason}`);
      await ticket.save();

      const setupTicket = await ticketSetupSchema.findOne({ guildID: guild.id });

      if (!setupTicket) {
        return await interaction.editReply({
          content: 'Ticket setup not found.',
          ephemeral: true,
        });
      }

      const logChannel = guild.channels.cache.get(setupTicket.logChannelID);

      // Generate the transcript
      const transcript = await dht.createTranscript(channel, {
        returnType: 'buffer',
        poweredBy: false,
      });

      // Define the transcript link
      const transcriptURL = `https://transcript.clienterr.com/api/transcript/${channel.id}`;

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('Red')
          .addFields(
            { name: ':id: Ticket ID', value: ticket.ticketChannelID.toString(), inline: true },
            { name: ':open_file_folder: Opened By', value: `<@${ticket.ticketMemberID}>`, inline: true },
            { name: ':timer: Closed By', value: `<@${member.id}>`, inline: true },
            { name: ':hourglass_flowing_sand: Open Time', value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`, inline: true },
            { name: ':hourglass: Close Time', value: `<t:${Math.floor(new Date().getTime() / 1000)}:F>`, inline: true },
            { name: ':clapper: Claimed By', value: ticket.claimedBy ? `<@${ticket.claimedBy}>` : 'Not claimed', inline: true },
            { name: ':receipt: Reason', value: reason || 'No reason specified', inline: false }
          )
          .setTimestamp();
        
        

        const transcriptButton = new ButtonBuilder()
        .setLabel('View Transcript')
        .setStyle(ButtonStyle.Link)
        .setURL(transcriptURL)
        .setEmoji('<:website:1162289689290620929>');

        const row = new ActionRowBuilder().addComponents(transcriptButton);

        await logChannel.send({ embeds: [logEmbed], components: [row] });
      }

      // Fetch the ticket member
      const ticketMember = await guild.members.fetch(ticket.ticketMemberID);

      if (ticketMember) {
        const userDM = await ticketMember.createDM();
        await userDM.send({
          content: `Your ticket has been closed. Reason: ${reason}. Your transcript is available at the following link: ${transcriptURL}`,
          files: [{
            attachment: transcript,
            name: `transcript-${channel.id}.html`
          }]
        });
      }


      // Upload the transcript to GitHub
      const githubToken = process.env.GITHUB_TOKEN; // Use environment variable for security
      const owner = 'GrishMahat';
      const repo = 'discordbot-html-transcript';
      const filePath = `transcripts/transcript-${channel.id}.html`;
      const commitMessage = `Add transcript for ticket ${channel.id}`;

      const content = transcript.toString('base64');

      const url = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      const headers = {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json'
      };
      const data = {
        message: commitMessage,
        content: content,
        branch: 'main'
      };

      // Check if the file already exists
      let sha;
      try {
        const response = await axios.get(url, { headers });
        sha = response.data.sha;
      } catch (error) {
        if (error.response && error.response.status !== 404) {
          console.error('Error checking file existence:', error.response.data);
          throw error;
        }
      }

      if (sha) {
        data.sha = sha; // Include SHA if updating an existing file
      }

      await axios.put(url, data, { headers });

      const staffRole = guild.roles.cache.get(setupTicket.staffRoleID);

      if (staffRole && ticketMember) {
        const hasRole = ticketMember.roles.cache.has(staffRole.id);
        if (!hasRole) {
          for (const memberID of ticket.membersAdded) {
            const addedMember = guild.members.cache.get(memberID);
            if (addedMember) await channel.permissionOverwrites.delete(addedMember);
          }
          await channel.permissionOverwrites.delete(ticketMember);
        }
      }

      // Update the ticket to closed in the database
      await ticketSchema.findOneAndUpdate(
        { guildID: guild.id, ticketChannelID: channel.id, closed: false },
        { closed: true, closeReason: reason },
        { new: true }
      );

      const closedEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Ticket Closed")
        .setDescription("This ticket has been closed.");

      await interaction.editReply({ embeds: [closedEmbed] });

      // Delete the ticket channel after a short delay
      setTimeout(() => {
        channel.delete().catch(error => {
          console.error('Error deleting ticket channel:', error);
        });
      }, 5000);

    } catch (error) {
      console.error('Error closing ticket:', error);
      await interaction.editReply({
        content: 'There was an error closing the ticket. Please try again later.',
        ephemeral: true
      });
    }
  }
};
