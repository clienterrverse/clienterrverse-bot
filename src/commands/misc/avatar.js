import {
   EmbedBuilder,
   SlashCommandBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';

export default {
   data: new SlashCommandBuilder()
      .setName('avatar')
      .setDescription('Show avatar of any user')
      .addUserOption((option) =>
         option
            .setName('user')
            .setDescription('User whose avatar you want to see:')
            .setRequired(false)
      ),

   userPermissions: [],
   botPermissions: [],
   category: 'Misc',
   cooldown: 5,
   deleted: false,
   nwfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      try {
         const user = interaction.options.getUser('user') || interaction.user;
         const member = interaction.guild.members.cache.get(user.id);

         const getAvatarUrl = (userOrMember, size = 1024) => {
            return userOrMember.displayAvatarURL({
               format: 'png',
               dynamic: true,
               size: size,
            });
         };

         const userAvatar = getAvatarUrl(user);
         const memberAvatar = member ? getAvatarUrl(member) : null;

         const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Avatar`)
            .setDescription(`[Avatar URL](${userAvatar})`)
            .setImage(userAvatar)
            .setColor(member?.displayHexColor || '#eb3434')
            .addFields(
               { name: '🆔 User ID', value: user.id, inline: true },
               {
                  name: '📅 Account Created',
                  value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                  inline: true,
               }
            )
            .setFooter({
               text: `Requested by ${interaction.user.username}`,
               iconURL: getAvatarUrl(interaction.user, 32),
            })
            .setTimestamp();

         if (memberAvatar && memberAvatar !== userAvatar) {
            embed.addFields({
               name: '🔗 Server Avatar',
               value: `[View](${memberAvatar})`,
               inline: true,
            });
         }

         const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setLabel('🌐 View in Browser')
               .setStyle(ButtonStyle.Link)
               .setURL(userAvatar),
            new ButtonBuilder()
               .setCustomId('avatar_refresh')
               .setLabel('🔄 Refresh')
               .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
               .setCustomId('avatar_delete')
               .setLabel('🗑️ Delete')
               .setStyle(ButtonStyle.Danger)
         );

         const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true,
         });

         const collector = response.createMessageComponentCollector({
            time: 60000,
         });

         collector.on('collect', async (i) => {
            if (i.user.id !== interaction.user.id) {
               return i.reply({
                  content: 'You cannot use these buttons.',
                  ephemeral: true,
               });
            }

            if (i.customId === 'avatar_refresh') {
               const refreshedEmbed = EmbedBuilder.from(embed).setImage(
                  getAvatarUrl(user, 1024) + '?t=' + Date.now()
               );
               await i.update({ embeds: [refreshedEmbed] });
            } else if (i.customId === 'avatar_delete') {
               await i.message.delete();
            }
         });

         collector.on('end', async () => {
            const disabledRow = ActionRowBuilder.from(row).setComponents(
               row.components.map((component) =>
                  ButtonBuilder.from(component).setDisabled(true)
               )
            );
            await response.edit({ components: [disabledRow] }).catch(() => {});
         });
      } catch (error) {
         await interaction.reply({
            content:
               'An error occurred while processing your command. Please try again later.',
            ephemeral: true,
         });
         throw error;
      }
   },
};
