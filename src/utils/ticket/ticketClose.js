// src/utils/ticket/ticketClose.js

import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ticketSchema from '../../schemas/ticketSchema.js';
import ticketSetupSchema from '../../schemas/ticketSetupSchema.js';
import axios from 'axios';
import dht from "discord-html-transcripts";

export async function closeTicket(client, guild, channel, member, reason) {
  try {
    const ticket = await ticketSchema.findOne({ ticketChannelID: channel.id });

    if (!ticket) {
      return { success: false, message: 'Ticket not found.' };
    }

    ticket.status = 'closed';
    ticket.closedBy = member.id;
    ticket.reason = reason;
    ticket.actionLog.push(`Ticket closed by ${member.user.tag} at ${new Date().toISOString()}: ${reason}`);
    await ticket.save();

    const setupTicket = await ticketSetupSchema.findOne({ guildID: guild.id });

    if (!setupTicket) {
      return { success: false, message: 'Ticket setup not found.' };
    }

    const logChannel = guild.channels.cache.get(setupTicket.logChannelID);

    // Generate the transcript
    const transcript = await dht.createTranscript(channel, {
      returnType: 'buffer',
      poweredBy: false,
    });

    const transcriptURL = `https://transcript.clienterr.com/api/transcript/${channel.id}`;

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setTitle("Ticket Close")
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

    // Fetch the ticket member and send DM
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
    await uploadTranscriptToGitHub(channel.id, transcript);

    // Update permissions
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

    // Delete the ticket channel after a short delay
    setTimeout(() => {
      channel.delete().catch(error => {
        console.error('Error deleting ticket channel:', error);
      });
    }, 5000);

    return { success: true, message: 'Ticket closed successfully.' };
  } catch (error) {
    console.error('Error closing ticket:', error);
    return { success: false, message: 'There was an error closing the ticket. Please try again later.' };
  }
}

async function uploadTranscriptToGitHub(channelId, transcript) {
  const githubToken = process.env.GITHUB_TOKEN;
  const owner = 'GrishMahat';
  const repo = 'discordbot-html-transcript';
  const filePath = `transcripts/transcript-${channelId}.html`;
  const commitMessage = `Add transcript for ticket ${channelId}`;

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

  try {
    const response = await axios.get(url, { headers });
    data.sha = response.data.sha;
  } catch (error) {
    if (error.response && error.response.status !== 404) {
      console.error('Error checking file existence:', error.response.data);
      throw error;
    }
  }

  await axios.put(url, data, { headers });
}