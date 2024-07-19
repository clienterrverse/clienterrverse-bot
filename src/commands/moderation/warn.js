import {
   SlashCommandBuilder,
   EmbedBuilder,
   PermissionsBitField,
   SnowflakeUtil,
   Colors,
} from 'discord.js';

import { config } from '../../config/config.js';

import { Infraction } from '../../schemas/infractionSchema.js';

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
            .setRequired(true)
      ),

   userPermissions: [PermissionsBitField.Flags.ModerateMembers],
   botPermissions: [],
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: false,

   run: async (client, interaction) => {
      const { options, guild, member, channel } = interaction;

      // Constants
      const reason = options.getString('reason');
      const target = options.getMember('member');
      const date = `<t:${Math.round(Date.now() / 1000)}:F>`;
      const infractionId = SnowflakeUtil.generate();
      const embed = new EmbedBuilder().setColor(Colors.Red);

      // Checks
      if (target.user.bot) {
         embed.setDescription('You cannot warn a bot!');
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (target.id === member.id) {
         embed.setDescription('You cannot warn yourself!');
         return interaction.reply({
            embeds: [embed],
            ephemeral: true,
         });
      }

      if (target.roles.highest.position >= member.roles.highest.position) {
         embed.setDescription(
            `You cannot warn a member with a role superior (or equal) to yours!`
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
            expires: 'Never',
         };
         await new Infraction(infractionData).save();
      } catch (e) {
         console.log(e);
      }

      const dmLog = new EmbedBuilder()
         .setColor('#fcd44c')
         .setAuthor({
            name: `You were warned in ${interaction.guild.name}`,
            iconURL: interaction.guild.iconURL({
               dynamic: true,
            }),
         })
         .addFields({
            name: `Reason`,
            value: `${reason}`,
         })
         .setFooter({
            text: `Infraction ID: ${infractionId}`,
         });
      await target.send({
         embeds: [dmLog],
      });

      const logChannel = guild.channels.cache.find(
         (channel) => channel.id === config.logChannel
      );
      if (!logChannel) return;

      const embedLog = new EmbedBuilder()
         .setColor('fcd44c')
         .setAuthor({
            name: `Member Warned | ${target.user.username}`,
            iconURL: target.user.displayAvatarURL(),
         })
         .addFields(
            { name: 'User', value: `${target.user}` },
            {
               name: 'Moderator',
               value: `${member.user} `,
            },
            { name: 'Reason', value: reason },
            { name: 'Date', value: date }
         )
         .setFooter({ text: `Infraction ID: ${infractionId}` });

      await logChannel
         .send({
            embeds: [embedLog],
         })
         .catch(() => {});
   },
};
