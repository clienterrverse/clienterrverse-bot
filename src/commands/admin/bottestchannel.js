import {
   SlashCommandBuilder,
   ChannelType,
   PermissionFlagsBits,
} from 'discord.js';

export default {
   data: new SlashCommandBuilder()
      .setName('bottestchannel')
      .setDescription(
         'Creates a bot-testing channel under a bot-development category for developers only'
      ),
   run: async (client, interaction) => {
      const { guild, member } = interaction;
      const developerUserIDs = ['DEVELOPER_ID']; // Replace with actual developer user IDs

      // Log the member's ID for debugging
      console.log('Member ID:', member.id);

      // Check if the member's ID is in the list of developer user IDs
      if (!developerUserIDs.includes(member.id)) {
         return interaction.reply({
            content: 'You do not have permission to use this command.',
            ephemeral: true,
         });
      }

      try {
         // Create the bot-development category if it doesn't already exist
         let category = guild.channels.cache.find(
            (c) =>
               c.name === 'bot-development' &&
               c.type === ChannelType.GuildCategory
         );
         if (!category) {
            category = await guild.channels.create({
               name: 'bot-development',
               type: ChannelType.GuildCategory,
               permissionOverwrites: [
                  {
                     id: guild.id,
                     deny: [PermissionFlagsBits.ViewChannel],
                  },
                  {
                     id: member.id,
                     allow: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages,
                     ],
                  },
               ],
            });
         }

         // Create the bot-testing channel under the bot-development category
         const channel = await guild.channels.create({
            name: 'bot-testing',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
               {
                  id: guild.id,
                  deny: [PermissionFlagsBits.ViewChannel],
               },
               {
                  id: member.id,
                  allow: [
                     PermissionFlagsBits.ViewChannel,
                     PermissionFlagsBits.SendMessages,
                  ],
               },
            ],
         });

         await interaction.reply({
            content: `Channel ${channel} created successfully under the ${category.name} category for developers.`,
            ephemeral: true,
         });
      } catch (error) {
         console.error('Error creating channel:', error);
         await interaction.reply({
            content:
               'There was an error creating the channel. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
