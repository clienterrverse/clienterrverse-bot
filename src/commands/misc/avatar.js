import {
   EmbedBuilder,
   SlashCommandBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
   PermissionFlagsBits,
} from 'discord.js';
import {
   Avatar,
   AvatarRating,
   AvatarChallenge,
} from '../../schemas/AvatarSchema.js';

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
   prefix: true,

   run: async (client, interaction) => {
      try {
         await interaction.deferReply();

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

         // Save the current avatar to the database only if it's different from the last one
         let newAvatar = await Avatar.findOne({
            userId: user.id,
            guildId: interaction.guild.id,
         }).sort({ timestamp: -1 });

         if (!newAvatar || newAvatar.avatarUrl !== userAvatar) {
            newAvatar = new Avatar({
               userId: user.id,
               guildId: interaction.guild.id,
               avatarUrl: userAvatar,
               isGlobal: true,
            });
            await newAvatar.save();
         }

         // Fetch avatar history
         const avatarHistory = await Avatar.find({
            userId: user.id,
            guildId: interaction.guild.id,
         })
            .sort({ timestamp: -1 })
            .limit(5);

         // Fetch avatar rating
         const avatarRatings = await AvatarRating.find({
            avatarId: newAvatar._id,
         });
         const averageRating =
            avatarRatings.length > 0
               ? (
                    avatarRatings.reduce(
                       (sum, rating) => sum + rating.rating,
                       0
                    ) / avatarRatings.length
                 ).toFixed(1)
               : 'No ratings yet';

         // Fetch active avatar challenge
         const activeChallenge = await AvatarChallenge.findOne({
            guildId: interaction.guild.id,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
         });

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
               },
               {
                  name: '🎭 Activity Status',
                  value: member?.presence?.status || 'Offline',
                  inline: true,
               },
               {
                  name: '📆 Server Join Date',
                  value: member
                     ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                     : 'N/A',
                  inline: true,
               },
               {
                  name: '👑 Roles',
                  value: member
                     ? member.roles.cache
                          .filter((r) => r.id !== interaction.guild.id)
                          .map((r) => `<@&${r.id}>`)
                          .join(', ') || 'None'
                     : 'N/A',
                  inline: false,
               },
               {
                  name: '📜 Avatar History',
                  value:
                     avatarHistory
                        .map(
                           (a, index) =>
                              `[${index === 0 ? 'Current' : `${index + 1}`}](${a.avatarUrl})`
                        )
                        .join(' | ') || 'No history available',
                  inline: false,
               },
               {
                  name: '⭐ Average Rating',
                  value:
                     averageRating +
                     (averageRating !== 'No ratings yet' ? '/5' : ''),
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

         if (activeChallenge) {
            embed.addFields({
               name: '🏆 Active Avatar Challenge',
               value: `"${activeChallenge.title}" - Ends <t:${Math.floor(activeChallenge.endDate.getTime() / 1000)}:R>`,
               inline: false,
            });
         }

         const row1 = new ActionRowBuilder().addComponents(
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
               .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
               .setCustomId('avatar_compare')
               .setLabel('🔍 Compare Avatars')
               .setStyle(ButtonStyle.Secondary)
               .setDisabled(!memberAvatar || memberAvatar === userAvatar)
         );

         const row2 = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('avatar_rate')
               .setLabel('⭐ Rate Avatar')
               .setStyle(ButtonStyle.Success)
         );

         const response = await interaction.editReply({
            embeds: [embed],
            components: [row1, row2],
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

            switch (i.customId) {
               case 'avatar_refresh':
                  const refreshedEmbed = EmbedBuilder.from(embed).setImage(
                     getAvatarUrl(user, 1024) + '?t=' + Date.now()
                  );
                  await i.update({ embeds: [refreshedEmbed] });
                  break;
               case 'avatar_delete':
                  await i.message.delete();
                  break;
               case 'avatar_compare':
                  const compareEmbed = new EmbedBuilder()
                     .setTitle(`Avatar Comparison for ${user.username}`)
                     .setDescription('Global Avatar vs Server Avatar')
                     .setColor(member?.displayHexColor || '#eb3434')
                     .setImage(userAvatar)
                     .setThumbnail(memberAvatar);
                  await i.update({ embeds: [compareEmbed] });
                  break;

               case 'avatar_rate':
                  const existingRating = await AvatarRating.findOne({
                     avatarId: newAvatar._id,
                     raterId: i.user.id,
                  });

                  if (existingRating) {
                     return i.reply({
                        content: 'You have already rated this avatar.',
                        ephemeral: true,
                     });
                  }

                  const rating = Math.floor(Math.random() * 5) + 1;
                  const newRating = new AvatarRating({
                     avatarId: newAvatar._id,
                     raterId: i.user.id,
                     rating: rating,
                  });
                  await newRating.save();

                  // Update the average rating in the embed
                  const updatedRatings = await AvatarRating.find({
                     avatarId: newAvatar._id,
                  });
                  const newAverageRating = (
                     updatedRatings.reduce((sum, r) => sum + r.rating, 0) /
                     updatedRatings.length
                  ).toFixed(1);
                  embed.spliceFields(-2, 1, {
                     name: '⭐ Average Rating',
                     value: `${newAverageRating}/5`,
                     inline: true,
                  });

                  await i.update({
                     content: `You rated this avatar ${rating}/5 stars!`,
                     embeds: [embed],
                  });
                  break;
            }
         });

         collector.on('end', async () => {
            const disabledRow1 = ActionRowBuilder.from(row1).setComponents(
               row1.components.map((component) =>
                  ButtonBuilder.from(component).setDisabled(true)
               )
            );
            const disabledRow2 = ActionRowBuilder.from(row2).setComponents(
               row2.components.map((component) =>
                  ButtonBuilder.from(component).setDisabled(true)
               )
            );
            await response
               .edit({ components: [disabledRow1, disabledRow2] })
               .catch(() => {});
         });
      } catch (error) {
         console.error('Error in avatar command:', error);
         await interaction.editReply({
            content:
               'An error occurred while processing the command. Please try again later.',
            ephemeral: true,
         });
      }
   },
};
