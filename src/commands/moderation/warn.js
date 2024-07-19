import {
   SlashCommandBuilder,
   EmbedBuilder,
   PermissionsBitField,
   SnowflakeUtil,
   Colors,
} from 'discord.js';

import { config } from '../../config/config.js';

import { Infraction } from '../../schemas/infractionSchema.js';

import ms from 'ms';

export default {
   data: new SlashCommandBuilder()
      .setName('warn')
      .setDescription('Issue a warning to a user.')
      .addUserOption((option) =>
         option
            .setName('member')
            .setDescription('The member you would like to warn.')
            .setRequired(true)
      )
      .addStringOption((option) =>
         option
            .setName('reason')
            .setDescription('The reason for warning this member.')
      )
      .addStringOption((opt) =>
         opt
            .setName('duration')
            .setDescription(
               'Delete the warning after the specific duration. Use `permanent` for it to never expire.'
            )
      ),

   userPermissions: [PermissionsBitField.Flags.ModerateMembers],
   botPermissions: [],
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      const { options, guild, member, channel } = interaction;
      const embed = new EmbedBuilder().setColor(Colors.Red);

      const date = Date.now();
      const reason = options.getString('reason') ?? 'Unspecified Reason.';
      const target = options.getMember('member');
      const durationStr = options.getString('duration');
      let duration = durationStr ? ms(durationStr) : null;
      let expires = duration ? duration + date : null;

      const infractionId = SnowflakeUtil.generate();

      if (!target) {
         embed.setDescription(
            `${client.config.emotes.fail} User is not in the guild.`
         );
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (target.user.bot) {
         embed.setDescription(
            `${client.config.emotes.fail} You cannot warn a bot.`
         );
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (target.id === member.id) {
         embed.setDescription(
            `${client.config.emotes.fail} You cannot warn yourself.`
         );
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (target.roles.highest.position >= member.roles.highest.position) {
         embed.setDescription(
            `${client.config.emotes.fail} You cannot warn a member with a role superior (or equal) to yours.`
         );
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (isNaN(duration) && durationStr !== 'permanent') {
         embed.setDescription('Invalid Duration.');
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }
      if (duration && duration < 1000) {
         embed.setDescription(
            `${client.config.emotes.fail} Temporary warn duration must be at least 1 second.`
         );
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      await interaction.deferReply({
         ephemeral: true,
      });

      const warnEmbed = new EmbedBuilder()
         .setTitle(`Submitted: warn`)
         .setColor('#800080')
         .setDescription(
            `User: <@!${target.id}>\nInfraction ID: ${infractionId}`
         );
      await channel.send({
         embeds: [warnEmbed],
         ephemeral: true,
      });
      await interaction.deleteReply();

      try {
         const infractionData = {
            guildId: interaction.guild.id,
            moderatorId: member.user.id,
            infractionId: infractionId,
            userId: target.user.id,
            date: date,
            reason: reason,
            type: 'Warn',
            expires:
               duration && duration !== 'Permanent'
                  ? `${Date.now() + duration}`
                  : 'Never',
         };
         await new Infraction(infractionData).save();
      } catch (e) {
         console.log(e);
      }

      const dmLog = new EmbedBuilder();
      dmLog.setColor(Colors.Yellow);
      dmLog.setAuthor({
         name: `You were warned in ${interaction.guild.name}`,
         iconURL: interaction.guild.iconURL({
            dynamic: true,
         }),
      });
      dmLog
         .addFields(
            {
               name: `Reason`,
               value: `${reason}`,
            },
            { name: `Moderator`, value: `${member.user}` }
         )

         .setFooter({
            text: `Infraction ID: ${infractionId}`,
         });
      if (expires) {
         dmLog.addFields({
            name: 'Expires',
            value: `<t:${Math.floor(Number(expires) / 1000)}> (<t:${Math.floor(
               Number(expires) / 1000
            )}:R>)`,
         });
      }

      await target
         .send({
            embeds: [dmLog],
         })
         .catch(() => {});

      const logChannel = guild.channels.cache.find(
         (channel) => channel.id === config.logChannel
      );
      if (!logChannel) return;

      const embedLog = new EmbedBuilder()
         .setColor(Colors.Yellow)
         .setAuthor({
            name: `Warn | ${target.user.username}`,
            iconURL: target.user.displayAvatarURL(),
         })
         .addFields(
            { name: 'User', value: `${target.user}` },
            {
               name: 'Moderator',
               value: `${member.user} `,
            },
            { name: 'Reason', value: reason }
         )

         .setFooter({ text: `Infraction ID: ${infractionId}` })
         .setTimestamp();
      if (duration && duration !== 'permanent') {
         embedLog.addFields(
            {
               name: 'Duration',
               value: `${ms(Number(duration), { long: true })}`,
            },
            {
               name: 'Expires',
               value: `<t:${Math.floor(
                  Number(Date.now() + duration) / 1000
               )}> (<t:${Math.floor(Number(Date.now() + duration) / 1000)}:R>)`,
            }
         );
      }

      await logChannel
         .send({
            embeds: [embedLog],
         })
         .catch(() => {});
   },
};
