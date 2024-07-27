import {
   SlashCommandBuilder,
   PermissionsBitField,
   EmbedBuilder,
} from 'discord.js';

export default {
   data: new SlashCommandBuilder()
      .setName('purge')
      .setDescription('Delete a specified number of messages.')
      .addIntegerOption((option) =>
         option
            .setName('amount')
            .setDescription('Number of messages to delete (1-100)')
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(100)
      )
      .addUserOption((option) =>
         option
            .setName('user')
            .setDescription('Only delete messages from this user')
            .setRequired(false)
      )
      .toJSON(),
   userPermissions: [PermissionsBitField.Flags.MANAGE_MESSAGES],
   botPermissions: [PermissionsBitField.Flags.MANAGE_MESSAGES],
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   category: 'Admin',
   prefix: true,

   run: async (client, interaction) => {
      const amount = interaction.options.getInteger('amount');
      const user = interaction.options.getUser('user');

      await interaction.deferReply({ ephemeral: true });

      try {
         let messages;
         if (user) {
            messages = await interaction.channel.messages.fetch({ limit: 100 });
            messages = messages
               .filter((m) => m.author.id === user.id)
               .first(amount);
         } else {
            messages = await interaction.channel.messages.fetch({
               limit: amount,
            });
         }

         const deletedMessages = await interaction.channel.bulkDelete(
            messages,
            true
         );

         const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('Purge Command Executed')
            .setDescription(
               `Successfully deleted ${deletedMessages.size} messages.`
            )
            .addFields(
               {
                  name: 'Channel',
                  value: interaction.channel.name,
                  inline: true,
               },
               { name: 'Executor', value: interaction.user.tag, inline: true },
               {
                  name: 'Target User',
                  value: user ? user.tag : 'All Users',
                  inline: true,
               }
            )
            .setTimestamp();

         await interaction.editReply({ embeds: [embed] });

         // Log the action
         const logChannel = interaction.guild.channels.cache.find(
            (channel) => channel.name === 'mod-logs'
         );
         if (logChannel) {
            await logChannel.send({ embeds: [embed] });
         }
      } catch (error) {
         console.error('Error in purge command:', error);
         await interaction.editReply({
            content:
               'There was an error trying to purge messages. Make sure the messages are not older than 14 days.',
            ephemeral: true,
         });
      }
   },
};
