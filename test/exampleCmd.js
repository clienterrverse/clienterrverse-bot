import dht from "discord-html-transcripts";
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import ticketSchema from "../schemas/ticketSchema.js";
import ticketSetupSchema from "../schemas/ticketSetupSchema.js";
import axios from 'axios';

export default {
  customId: "confirmCloseTicketBtn",
  userPermissions: [PermissionFlagsBits.ManageThreads],
  botPermissions: [],
  run: async (client, interaction) => {
    try {
      const { channel, guild, user } = interaction;

      const closingEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Closing Ticket")
        .setDescription("Closing ticket...");

      await channel.send({ embeds: [closingEmbed] });

      await interaction.deferReply({ ephemeral: true });

      const closedEmbed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("Ticket Closed")
        .setDescription("This ticket has been closed.");

      // Fetch ticket setup and ticket details from the database
      const setupTicket = await ticketSetupSchema.findOne({
        guildID: guild.id,
      });

      const ticket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id,
        closed: false
      });

      if (!setupTicket || !ticket) {
        return await interaction.editReply({
          content: 'Ticket setup or ticket not found.',
          ephemeral: true
        });
      }

      // Generate the transcript
      const transcript = await dht.createTranscript(channel, {
        returnType: 'buffer',
        poweredBy: false, // Whether to include the "Powered by discord-html-transcripts" footer
      });

      // Send transcript to the user via DM
      const dmChannel = await user.createDM();
      await dmChannel.send({
        files: [{
          attachment: transcript,
          name: `transcript-${channel.id}.html`
        }]
      });

      // Send transcript to the log channel
      const logChannel = guild.channels.cache.get(setupTicket.logChannelID);
      if (logChannel) {
        await logChannel.send({
          files: [{
            attachment: transcript,
            name: `transcript-${channel.id}.html`
          }]
        });
      }

      // Upload the transcript to GitHub
      const githubToken = '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';
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
        branch: 'main' // or the branch you want to upload to
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
      const hasRole = guild.members.cache.get(ticket.ticketMemberID).roles.cache.has(staffRole.id);

      if (!hasRole) {
        for (const memberID of ticket.membersAdded) {
          const member = guild.members.cache.get(memberID);
          if (member) await channel.permissionOverwrites.delete(member);
        }
        const ticketMember = guild.members.cache.get(ticket.ticketMemberID);
        if (ticketMember) await channel.permissionOverwrites.delete(ticketMember);
      }

      // Update the ticket to closed in the database
      await ticketSchema.findOneAndUpdate(
        { guildID: guild.id, ticketChannelID: channel.id, closed: false },
        { closed: true }
      );

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
