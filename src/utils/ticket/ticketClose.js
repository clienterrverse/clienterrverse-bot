// src/utils/ticket/ticketClose.js

import {
   EmbedBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';
import ticketSchema from '../../schemas/ticketSchema.js';
import ticketSetupSchema from '../../schemas/ticketSetupSchema.js';
import axios from 'axios';
import dht from 'discord-html-transcripts';

export async function closeTicket(client, guild, channel, member, reason) {
   try {
      const ticket = await ticketSchema.findOne({
         ticketChannelID: channel.id,
      });

      if (!ticket) return { success: false, message: 'Ticket not found.' };

      ticket.status = 'closed';
      ticket.closedBy = member.id;
      ticket.reason = reason;
      ticket.actionLog.push(
         `Ticket closed by ${member.user.tag} at ${new Date().toISOString()}: ${reason}`
      );
      await ticket.save();

      const setupTicket = await ticketSetupSchema.findOne({
         guildID: guild.id,
      });

      if (!setupTicket)
         return { success: false, message: 'Ticket setup not found.' };

      const logChannel = guild.channels.cache.get(setupTicket.logChannelID);

      // Generate the transcript
      const transcript = await dht.createTranscript(channel, {
         returnType: 'buffer',
         poweredBy: false,
      });

      const transcriptURL = `https://transcript.clienterr.com/api/transcript/${channel.id}`;

      if (logChannel) {
         const logEmbed = new EmbedBuilder()
            .setTitle('Ticket Close')
            .setColor('Red')
            .addFields(
               {
                  name: '📝 Subject',
                  value: ticket.subject || 'No subject provided',
               },
               {
                  name: '🗒️ Description',
                  value: ticket.description || 'No description provided',
               },
               {
                  name: '🆔 Ticket ID',
                  value: ticket.ticketChannelID.toString(),
                  inline: true,
               },
               {
                  name: '👤 Opened By',
                  value: `<@${ticket.ticketMemberID}>`,
                  inline: true,
               },
               {
                  name: '🔒 Closed By',
                  value: ticket.closedBy
                     ? `<@${ticket.closedBy}>`
                     : 'Not closed',
                  inline: true,
               },
               {
                  name: '📅 Open Time',
                  value: `<t:${Math.floor(new Date(ticket.createdAt).getTime() / 1000)}:F>`,
                  inline: true,
               },
               {
                  name: '📆 Close Time',
                  value: `<t:${Math.floor(new Date().getTime() / 1000)}:F>`,
                  inline: true,
               },
               {
                  name: '🔖 Claimed By',
                  value: ticket.claimedBy
                     ? `<@${ticket.claimedBy}>`
                     : 'Not claimed',
                  inline: true,
               },
               {
                  name: '📝 Reason',
                  value: reason || 'No reason specified',
                  inline: false,
               }
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

      const ticketMember = await guild.members.fetch(ticket.ticketMemberID);
      if (ticketMember) {
         const userDM = await ticketMember.createDM();

         const dmEmbed = new EmbedBuilder()
            .setTitle('Ticket Closed')
            .setColor('#FF5555') // A soft red color
            .setDescription(`Your ticket in ${guild.name} has been closed.`)
            .addFields(
               {
                  name: '📝 Subject',
                  value: ticket.subject || 'No subject provided',
               },
               {
                  name: '🗒️ Description',
                  value: ticket.description || 'No description provided',
               },
               {
                  name: '🆔 Ticket ID',
                  value: ticket.ticketChannelID.toString(),
                  inline: true,
               },
               {
                  name: '🔒 Closed By',
                  value: ticket.closedBy
                     ? `<@${ticket.closedBy}>`
                     : 'Not closed',
                  inline: true,
               },
               { name: '📝 Reason', value: reason || 'No reason specified' },
               {
                  name: '📜 Transcript',
                  value: transcriptURL
                     ? `[Click here to view](${transcriptURL})`
                     : 'No transcript available',
               }
            )
            .setFooter({ text: 'Thank you for using our ticket system!' })
            .setTimestamp();

         try {
            await userDM.send({
               content: "Here's a summary of your closed ticket:",
               embeds: [dmEmbed],
            });
         } catch (error) {
            throw error;
         }
      }

      await uploadTranscriptToGitHub(channel.id, transcript);

      const staffRole = guild.roles.cache.get(setupTicket.staffRoleID);
      if (staffRole && ticketMember) {
         const hasRole = ticketMember.roles.cache.has(staffRole.id);
         if (!hasRole) {
            for (const memberID of ticket.membersAdded) {
               const addedMember = guild.members.cache.get(memberID);
               if (addedMember)
                  await channel.permissionOverwrites.delete(addedMember);
            }
            await channel.permissionOverwrites.delete(ticketMember);
         }
      }

      await ticketSchema.findOneAndUpdate(
         { guildID: guild.id, ticketChannelID: channel.id, closed: false },
         { closed: true, closeReason: reason },
         { new: true }
      );

      setTimeout(() => {
         channel.delete().catch((error) => {
            console.error('Error deleting ticket channel:', error);
         });
      }, 5000);

      return { success: true, message: 'Ticket closed successfully.' };
   } catch (error) {
      console.error('Error closing ticket:', error);
      return {
         success: false,
         message:
            'There was an error closing the ticket. Please try again later.',
      };
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
      Authorization: `token ${githubToken}`,
      Accept: 'application/vnd.github.v3+json',
   };
   const data = {
      message: commitMessage,
      content: content,
      branch: 'main',
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
// TODO List
// 1. **Add Error Handling for GitHub Upload**: Improve error handling for the `uploadTranscriptToGitHub` function to provide more descriptive error messages and handle edge cases (e.g., invalid GitHub token, repository issues).
// 2. **Improve Logging for GitHub Upload**: Add detailed logging to monitor the GitHub upload process and handle potential issues with API requests or file management.
// 3. **Optimize Transcript Generation**: Consider adding additional error handling or fallback mechanisms for the transcript generation process using `discord-html-transcripts`.
// 4. **Enhance Permission Management**: Verify and handle scenarios where permissions might need to be adjusted more carefully, especially in edge cases with ticket members and staff roles.
// 5. **Refactor Common Code**: Extract reusable code (e.g., embed creation) into separate functions to reduce duplication and improve readability.
