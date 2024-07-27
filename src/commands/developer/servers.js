/** @format */

import {
   SlashCommandBuilder,
   EmbedBuilder,
   PermissionFlagsBits,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';
import paginateEmbeds from '../../utils/buttonPagination.js';
import mconfig from '../../config/messageConfig.js';

export default {
   data: new SlashCommandBuilder()
      .setName('servers')
      .setDescription(
         'Manage and view information about servers the bot is in.'
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('list')
            .setDescription(
               'List servers the bot is in and provide invite links'
            )
            .addBooleanOption((option) =>
               option
                  .setName('detailed')
                  .setDescription('Show detailed server information')
                  .setRequired(false)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('leave')
            .setDescription('Make the bot leave a specified server by its ID.')
            .addStringOption((option) =>
               option
                  .setName('server-id')
                  .setDescription('The ID of the server the bot should leave.')
                  .setRequired(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('check')
            .setDescription(
               'Check if the bot is in specified servers by their IDs.'
            )
            .addStringOption((option) =>
               option
                  .setName('server-ids')
                  .setDescription(
                     'Comma-separated IDs of the servers to check.'
                  )
                  .setRequired(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('user')
            .setDescription('Show the number of servers a user owns.')
            .addUserOption((option) =>
               option
                  .setName('user')
                  .setDescription('The user to check.')
                  .setRequired(true)
            )
      )
      .toJSON(),
   userPermissions: [PermissionFlagsBits.Administrator],
   botPermissions: [],
   cooldown: 10,
   nsfwMode: false,
   testMode: false,
   devOnly: true,
   category: 'Devloper',

   run: async (client, interaction) => {
      await interaction.deferReply({ ephemeral: true });
      const subcommand = interaction.options.getSubcommand();

      try {
         switch (subcommand) {
            case 'list':
               await handleListSubcommand(client, interaction);
               break;
            case 'leave':
               await handleLeaveSubcommand(client, interaction);
               break;
            case 'check':
               await handleCheckSubcommand(client, interaction);
               break;
            case 'user':
               await handleUserSubcommand(client, interaction);
               break;
            default:
               throw new Error(`Unknown subcommand: ${subcommand}`);
         }
      } catch (error) {
         console.error(`Error in servers command (${subcommand}):`, error);
         await interaction.editReply({
            content:
               'An error occurred while processing your request. Please try again later.',
            ephemeral: true,
         });
      }
   },
};

async function handleListSubcommand(client, interaction) {
   const isDetailed = interaction.options.getBoolean('detailed') ?? false;
   const guilds = await Promise.all(
      client.guilds.cache.map(async (guild) => {
         let inviteLink = 'No invite link available';
         try {
            const channels = guild.channels.cache.filter(
               (channel) =>
                  channel.type === 0 &&
                  channel
                     .permissionsFor(guild.members.me)
                     .has(PermissionFlagsBits.CreateInstantInvite)
            );
            if (channels.size > 0) {
               const invite = await channels
                  .first()
                  .createInvite({ maxAge: 0, maxUses: 0 });
               inviteLink = invite.url;
            }
         } catch (error) {
            console.error(
               `Could not create invite for guild ${guild.id}:`,
               error
            );
         }
         return {
            name: guild.name,
            memberCount: guild.memberCount,
            id: guild.id,
            inviteLink,
            owner: await guild.fetchOwner(),
            createdAt: guild.createdAt,
            boostLevel: guild.premiumTier,
         };
      })
   );

   if (guilds.length === 0) {
      return await interaction.editReply('The bot is not in any servers.');
   }

   const embeds = createServerListEmbeds(
      client,
      interaction,
      guilds,
      isDetailed
   );
   await paginateEmbeds(interaction, embeds);
}

function createServerListEmbeds(client, interaction, guilds, isDetailed) {
   const MAX_FIELDS = isDetailed ? 4 : 8;
   const embeds = [];

   for (let i = 0; i < guilds.length; i += MAX_FIELDS) {
      const currentGuilds = guilds.slice(i, i + MAX_FIELDS);
      const embed = new EmbedBuilder()
         .setTitle('Servers List')
         .setDescription(`The bot is in **${guilds.length}** servers.`)
         .setColor(mconfig.embedColorDefault)
         .setThumbnail(client.user.displayAvatarURL())
         .setFooter({
            text: `Page ${Math.floor(i / MAX_FIELDS) + 1}/${Math.ceil(guilds.length / MAX_FIELDS)} • Requested by ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({
               format: 'png',
               dynamic: true,
               size: 1024,
            }),
         });

      currentGuilds.forEach((guild) => {
         const fieldValue = isDetailed
            ? `ID: ${guild.id}\nMembers: ${guild.memberCount}\nOwner: ${guild.owner.user.tag}\nCreated: ${guild.createdAt.toDateString()}\nBoost Level: ${guild.boostLevel}\n[Invite Link](${guild.inviteLink})`
            : `ID: ${guild.id}\nMembers: ${guild.memberCount}\n[Invite Link](${guild.inviteLink})`;

         embed.addFields({ name: guild.name, value: fieldValue, inline: true });
      });

      embeds.push(embed);
   }

   return embeds;
}

async function handleLeaveSubcommand(client, interaction) {
   const serverId = interaction.options.getString('server-id');
   const guild = client.guilds.cache.get(serverId);

   if (!guild) {
      return await interaction.editReply(
         `I am not in a server with the ID ${serverId}.`
      );
   }

   const confirmButton = new ButtonBuilder()
      .setCustomId('confirm_leave')
      .setLabel('Confirm Leave')
      .setStyle(ButtonStyle.Danger);

   const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_leave')
      .setLabel('Cancel')
      .setStyle(ButtonStyle.Secondary);

   const row = new ActionRowBuilder().addComponents(
      confirmButton,
      cancelButton
   );

   const response = await interaction.editReply({
      content: `Are you sure you want me to leave the server **${guild.name}** (ID: ${serverId})?`,
      components: [row],
   });

   try {
      const confirmation = await response.awaitMessageComponent({
         filter: (i) => i.user.id === interaction.user.id,
         time: 30000,
      });

      if (confirmation.customId === 'confirm_leave') {
         await guild.leave();
         await confirmation.update({
            content: `I have left the server **${guild.name}** (ID: ${serverId}).`,
            components: [],
         });
      } else {
         await confirmation.update({
            content: 'Server leave cancelled.',
            components: [],
         });
      }
   } catch (error) {
      await interaction.editReply({
         content: 'No response received, cancelling server leave.',
         components: [],
      });
      throw error;
   }
}

async function handleCheckSubcommand(client, interaction) {
   const serverIds = interaction.options
      .getString('server-ids')
      .split(',')
      .map((id) => id.trim());
   const results = await Promise.all(
      serverIds.map(async (serverId) => {
         const guild = client.guilds.cache.get(serverId);
         if (guild) {
            const owner = await guild.fetchOwner();
            return `The bot is in the server **${guild.name}** (ID: ${serverId}).\nOwner: ${owner.user.tag}\nMembers: ${guild.memberCount}`;
         } else {
            return `The bot is not in a server with the ID ${serverId}.`;
         }
      })
   );

   await interaction.editReply(results.join('\n\n'));
}

async function handleUserSubcommand(client, interaction) {
   const user = interaction.options.getUser('user');
   const userServers = client.guilds.cache.filter(
      (guild) => guild.ownerId === user.id
   );
   const serverCount = userServers.size;

   const serverList = userServers
      .map(
         (guild) =>
            `- ${guild.name} (ID: ${guild.id}, Members: ${guild.memberCount})`
      )
      .join('\n');

   const embed = new EmbedBuilder()
      .setTitle(`Servers Owned by ${user.username}`)
      .setDescription(
         `User ${user.username} (ID: ${user.id}) owns **${serverCount}** server(s) that the bot is in.`
      )
      .setColor(mconfig.embedColorDefault)
      .addFields({
         name: 'Server List',
         value: serverList || 'No servers found.',
      })
      .setFooter({
         text: `Requested by ${interaction.user.username}`,
         iconURL: interaction.user.displayAvatarURL({
            format: 'png',
            dynamic: true,
            size: 1024,
         }),
      });

   await interaction.editReply({ embeds: [embed] });
}
