import {
   SlashCommandBuilder,
   PermissionFlagsBits,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';
import Bottleneck from 'bottleneck';

const limiter = new Bottleneck({
   minTime: 1000,
   maxConcurrent: 1,
});

export default {
   data: new SlashCommandBuilder()
      .setName('dm')
      .setDescription(
         'Send a direct message to a user, role, or all members in the server'
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('user')
            .setDescription('Send a DM to a specific user')
            .addUserOption((option) =>
               option
                  .setName('target')
                  .setDescription('The user to send the DM to')
                  .setRequired(true)
            )
            .addStringOption((option) =>
               option
                  .setName('message')
                  .setDescription(
                     "The message to send (Use {user} for recipient's name)"
                  )
                  .setRequired(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('role')
            .setDescription('Send a DM to all users with a specific role')
            .addRoleOption((option) =>
               option
                  .setName('target')
                  .setDescription('The role to send the DM to')
                  .setRequired(true)
            )
            .addStringOption((option) =>
               option
                  .setName('message')
                  .setDescription(
                     "The message to send (Use {user} for recipient's name)"
                  )
                  .setRequired(true)
            )
      )
      .toJSON(),

   userPermissions: [PermissionFlagsBits.ManageMessages],
   botPermissions: [PermissionFlagsBits.SendMessages],
   cooldown: 5,
   nwfwMode: false,
   testMode: false,
   devOnly: true,
   category: 'Devloper',
   prefix: false,

   run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();
      let message = interaction.options.getString('message').trim();

      const sendMessage = async (user) => {
         if (!user || user.bot) {
            return { success: false, reason: 'USER_NOT_FOUND_OR_BOT' };
         }

         try {
            const personalizedMessage = message.replace(
               /{user}/g,
               user.displayName
            );
            await limiter.schedule(() => user.send(personalizedMessage));
            return { success: true };
         } catch (error) {
            if (error.code === 50007) {
               return { success: false, reason: 'DM_CLOSED' };
            } else if (error.code === 10013) {
               return { success: false, reason: 'USER_NOT_FOUND' };
            } else if (error.code === 50013) {
               return { success: false, reason: 'MISSING_PERMISSIONS' };
            } else if (error.code === 50016) {
               return { success: false, reason: 'RATE_LIMIT' };
            }
            return { success: false, reason: 'UNKNOWN', error };
         }
      };

      const handleProcess = async (members, description) => {
         const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
               .setCustomId('confirm')
               .setLabel('Confirm')
               .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
               .setCustomId('cancel')
               .setLabel('Cancel')
               .setStyle(ButtonStyle.Danger)
         );

         await interaction.reply({
            content: `Are you sure you want to send this message to ${members.size} ${description}?`,
            components: [row],
            ephemeral: true,
         });

         const filter = (i) => i.user.id === interaction.user.id;
         const confirmation = await interaction.channel
            .awaitMessageComponent({ filter, time: 30000 })
            .catch(() => null);

         if (!confirmation || confirmation.customId === 'cancel') {
            return interaction.editReply({
               content: 'Command cancelled.',
               components: [],
            });
         }

         let successCount = 0;
         let failureCount = 0;
         let count = 0;
         const totalMembers = members.size;
         const updateInterval = Math.max(1, Math.floor(totalMembers / 20)); // Update every 5%
         let cancelled = false;

         const processMember = async (member) => {
            if (cancelled) return;
            const result = await sendMessage(member.user);
            if (result.success) successCount++;
            else failureCount++;
            count++;

            if (count % updateInterval === 0 || count === totalMembers) {
               const progress = ((count / totalMembers) * 100).toFixed(2);
               const progressBar =
                  '█'.repeat(Math.floor(progress / 5)) +
                  '░'.repeat(20 - Math.floor(progress / 5));
               await interaction.editReply({
                  content: `Progress: ${progressBar} ${progress}%\n${count}/${totalMembers} messages sent`,
                  components: [
                     new ActionRowBuilder().addComponents(
                        new ButtonBuilder()
                           .setCustomId('cancel_sending')
                           .setLabel('Cancel Sending')
                           .setStyle(ButtonStyle.Danger)
                     ),
                  ],
                  ephemeral: true,
               });
            }
         };

         const cancelListener =
            interaction.channel.createMessageComponentCollector({
               filter,
               time: 600000,
            });
         cancelListener.on('collect', async (i) => {
            if (i.customId === 'cancel_sending') {
               cancelled = true;
               await i.update({
                  content: 'Cancelling the operation. Please wait...',
                  components: [],
               });
            }
         });

         for (const member of members.values()) {
            await processMember(member);
            if (cancelled) break;
         }

         cancelListener.stop();

         const finalMessage = cancelled
            ? `Operation cancelled. ${successCount} messages sent, ${failureCount} failed.`
            : `Finished! ${successCount} messages sent, ${failureCount} failed.`;

         await interaction.editReply({
            content: finalMessage,
            components: [],
         });
      };

      if (subcommand === 'user') {
         const user = interaction.options.getUser('target');
         const result = await sendMessage(user);

         if (result.success) {
            await interaction.reply({
               content: `Message sent to ${user.tag}`,
               ephemeral: true,
            });
         } else {
            let errorMessage = `Failed to send message to ${user.tag}. `;
            switch (result.reason) {
               case 'DM_CLOSED':
                  errorMessage += 'They have their DMs closed.';
                  break;
               case 'USER_NOT_FOUND':
                  errorMessage += 'User not found.';
                  break;
               case 'MISSING_PERMISSIONS':
                  errorMessage += 'Missing permissions to send message.';
                  break;
               case 'RATE_LIMIT':
                  errorMessage += 'Rate limit hit. Please try again later.';
                  break;
               default:
                  errorMessage += 'An unknown error occurred.';
            }
            await interaction.reply({ content: errorMessage, ephemeral: true });
         }
      } else if (subcommand === 'role') {
         const role = interaction.options.getRole('target');
         const members = role.members;
         await handleProcess(members, `members with the ${role.name} role`);
      } else if (subcommand === 'all') {
         const members = await interaction.guild.members.fetch();
         const humanMembers = members.filter((member) => !member.user.bot);
         await handleProcess(humanMembers, 'members in the server');
      }
   },
};
