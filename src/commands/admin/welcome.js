import {
   SlashCommandBuilder,
   PermissionsBitField,
   ChannelType,
   EmbedBuilder,
} from 'discord.js';
import welcomeSchema from '../../schemas/welcomeSchema.js';

export default {
   data: new SlashCommandBuilder()
      .setName('welcome')
      .setDescription('Manage the welcome feature.')
      .addSubcommand((subcommand) =>
         subcommand
            .setName('enable')
            .setDescription('Enable the welcome feature and set options.')
            .addChannelOption((option) =>
               option
                  .setName('channel')
                  .setDescription('The welcome channel')
                  .addChannelTypes(ChannelType.GuildText)
                  .setRequired(true)
            )
            .addRoleOption((option) =>
               option
                  .setName('joinrole')
                  .setDescription('The join role for new members')
                  .setRequired(true)
            )
            .addStringOption((option) =>
               option
                  .setName('message')
                  .setDescription('The welcome message')
                  .setRequired(true)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('disable')
            .setDescription('Disable the welcome feature.')
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('status')
            .setDescription('Check the current welcome feature status.')
      )
      .addSubcommand((subcommand) =>
         subcommand.setName('test').setDescription('Test the welcome message.')
      )
      .toJSON(),
   userPermissions: [PermissionsBitField.ADMINISTRATOR],
   botPermissions: [PermissionsBitField.ManageRoles],
   cooldown: 5,
   category: 'Admin',

   run: async (client, interaction) => {
      await interaction.deferReply({ ephemeral: true });
      const subcommand = interaction.options.getSubcommand();
      const guildId = interaction.guild.id;

      try {
         let welcomeSettings = await welcomeSchema.findOne({ guildId });
         if (!welcomeSettings) {
            welcomeSettings = new welcomeSchema({ guildId });
         }

         switch (subcommand) {
            case 'enable': {
               const channel = interaction.options.getChannel('channel');
               const role = interaction.options.getRole('joinrole');
               const message = interaction.options.getString('message');

               if (
                  !channel
                     .permissionsFor(interaction.guild.members.me)
                     .has(PermissionsBitField.Flags.SendMessages)
               ) {
                  return interaction.editReply(
                     "I don't have permission to send messages in the specified channel."
                  );
               }

               if (
                  role.position >=
                  interaction.guild.members.me.roles.highest.position
               ) {
                  return interaction.editReply(
                     "The specified role is higher than or equal to my highest role. I can't assign it."
                  );
               }

               welcomeSettings.enabled = true;
               welcomeSettings.channelId = channel.id;
               welcomeSettings.roleId = role.id;
               welcomeSettings.message = message;

               await welcomeSettings.save();

               const embed = new EmbedBuilder()
                  .setColor('#00FF00')
                  .setTitle('Welcome Feature Enabled')
                  .addFields(
                     {
                        name: 'Channel',
                        value: channel.toString(),
                        inline: true,
                     },
                     { name: 'Role', value: role.toString(), inline: true },
                     { name: 'Message', value: message }
                  )
                  .setTimestamp();

               return interaction.editReply({ embeds: [embed] });
            }

            case 'disable':
               welcomeSettings.enabled = false;
               await welcomeSettings.save();
               return interaction.editReply(
                  'Welcome feature has been disabled.'
               );

            case 'status': {
               const embed = new EmbedBuilder()
                  .setColor(welcomeSettings.enabled ? '#00FF00' : '#FF0000')
                  .setTitle('Welcome Feature Status')
                  .addFields({
                     name: 'Status',
                     value: welcomeSettings.enabled ? 'Enabled' : 'Disabled',
                  });

               if (welcomeSettings.enabled) {
                  const channel = interaction.guild.channels.cache.get(
                     welcomeSettings.channelId
                  );
                  const role = interaction.guild.roles.cache.get(
                     welcomeSettings.roleId
                  );

                  embed.addFields(
                     {
                        name: 'Channel',
                        value: channel ? channel.toString() : 'Not set',
                        inline: true,
                     },
                     {
                        name: 'Role',
                        value: role ? role.toString() : 'Not set',
                        inline: true,
                     },
                     {
                        name: 'Message',
                        value: welcomeSettings.message || 'Not set',
                     }
                  );
               }

               return interaction.editReply({ embeds: [embed] });
            }

            case 'test': {
               if (!welcomeSettings.enabled) {
                  return interaction.editReply(
                     'Welcome feature is not enabled. Enable it first to test.'
                  );
               }

               const channel = interaction.guild.channels.cache.get(
                  welcomeSettings.channelId
               );
               if (!channel) {
                  return interaction.editReply(
                     'The configured welcome channel no longer exists.'
                  );
               }

               const testMessage = welcomeSettings.message.replace(
                  '{user}',
                  interaction.user.toString()
               );
               await channel.send(testMessage);
               return interaction.editReply(
                  'Test welcome message sent to the configured channel.'
               );
            }

            default:
               return interaction.editReply('Invalid subcommand.');
         }
      } catch (error) {
         console.error('Error in welcome command:', error);
         return interaction.editReply(
            'There was an error processing your request. Please try again later.'
         );
      }
   },
};
