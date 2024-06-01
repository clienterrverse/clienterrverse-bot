import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } from 'discord.js';
import ticketSetupSchema from '../schemas/ticketSetupSchema.js';
import ticketSchema from '../schemas/ticketSchema.js';

export default {
  customId: 'feedbackTicketMdl',
  userPermissions: [],
  botPermissions: [],

  run: async (client, interaction) => {
    try {
      const { fields, guild, channel, message } = interaction;
      const feedbackMessage = fields.getTextInputValue('feedbackTicketMsg');
      const rating = fields.getTextInputValue('rateTicketMsg');

      await interaction.deferReply();

      // Validate rating
      if (isNaN(rating) || rating < 1 || rating > 5) {
        return await interaction.editReply({
          content: "Please provide a rating between 1 and 5"
        });
      }

      // Check if the rating is a number
      let isNum = /^\d+$/.test(rating);
      if (!isNum) {
        return await interaction.editReply({
          content: "Please provide a valid rating"
        });
      }

      // Fetch ticket setup and ticket
      const ticketSetup = await ticketSetupSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id
      });
      const ticket = await ticketSchema.findOne({
        guildID: guild.id,
        ticketChannelID: channel.id
      });

      // Update ticket with rating and feedback
      await ticket.updateOne({
        rating,
        feedback: feedbackMessage
      });

      // Generate star ratings
      let stars = "";
      for (let i = 0; i < rating; i++) {
        stars += "⭐";
      }

      // Calculate average rating
      const allTickets = await ticketSchema.find({ guildID: guild.id });
      const allRatings = allTickets.map(t => (t.rating !== undefined ? t.rating : 0));
      const totalRating = allRatings.reduce((acc, current) => acc + current, 0);
      const avgRating = (totalRating / allRatings.length).toFixed(2);

      let averageStars = "";
      for (let i = 0; i < Math.floor(avgRating); i++) {
        averageStars += "⭐";
      }

      // Create feedback embed
      const feedbackEmbed = new EmbedBuilder()
        .setColor("Blurple")
        .setTitle("Ticket Feedback")
        .setDescription(`**Rating:** ${stars}\n**Feedback:** ${feedbackMessage}\n\n**Average Rating:** ${averageStars} (${avgRating})`)
        .setFooter({
          text: `${guild.name} - Ticket Feedback`,
          iconURL: guild.iconURL()
        })
        .setTimestamp();

      // Send feedback embed to feedback channel
      const feedbackChannel = guild.channels.cache.get(ticketSetup.feedbackChannelID);
      if (feedbackChannel) {
        await feedbackChannel.send({ embeds: [feedbackEmbed] });
      } else {
        console.error('Feedback channel not found.');
      }

      // Disable the feedback button
      message.components[0].components[2].setDisabled(true);
      await message.edit({ components: [message.components[0]] });

      return await interaction.editReply({
        content: "Your feedback has been submitted"
      });
    } catch (error) {
      console.error(error);
      return await interaction.editReply({
        content: "There was an error submitting your feedback. Please try again later."
      });
    }
  }
};
