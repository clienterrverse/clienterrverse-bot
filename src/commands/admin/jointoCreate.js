import {
   SlashCommandBuilder,
   ChannelType,
   PermissionFlagsBits,
   EmbedBuilder,
   ActionRowBuilder,
   ButtonBuilder,
   ButtonStyle,
} from 'discord.js';
import JoinToSystem from '../../schemas/joinToSystemSetup.js';

export default {
   data: new SlashCommandBuilder()
      .setName('jointosystem')
      .setDescription('Manage the join-to-create system in your server.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addSubcommand((subcommand) =>
         subcommand
            .setName('setup')
            .setDescription(
               'Setup or update the join-to-create system in your server.'
            )
            .addChannelOption((option) =>
               option
                  .setName('join-channel')
                  .setDescription(
                     'The voice channel where users will join to create new channels.'
                  )
                  .setRequired(true)
                  .addChannelTypes(ChannelType.GuildVoice)
            )
            .addChannelOption((option) =>
               option
                  .setName('control-channel')
                  .setDescription('The text channel for control messages.')
                  .setRequired(true)
                  .addChannelTypes(ChannelType.GuildText)
            )
            .addChannelOption((option) =>
               option
                  .setName('category')
                  .setDescription(
                     'The category where new channels will be created.'
                  )
                  .setRequired(true)
                  .addChannelTypes(ChannelType.GuildCategory)
            )
      )
      .addSubcommand((subcommand) =>
         subcommand
            .setName('remove')
            .setDescription(
               'Remove the join-to-create system setup for the guild.'
            )
      )
      .toJSON(),

   userPermissions: [PermissionFlagsBits.Administrator],
   botPermissions: [
      PermissionFlagsBits.ManageChannels,
      PermissionFlagsBits.ManageRoles,
   ],
   category: 'Admin',

   run: async (client, interaction) => {
      const subcommand = interaction.options.getSubcommand();

      switch (subcommand) {
         case 'setup':
            await handleSetup(interaction);
            break;
         case 'remove':
            await handleRemove(interaction);
            break;
      }
   },
};

async function handleSetup(interaction) {
   try {
      const { guild, options } = interaction;

      const joinChannel = options.getChannel('join-channel');
      const controlChannel = options.getChannel('control-channel');
      const category = options.getChannel('category');

      await interaction.deferReply({ ephemeral: true });

      // Validate permissions
      if (
         !controlChannel
            .permissionsFor(guild.members.me)
            .has(PermissionFlagsBits.SendMessages)
      ) {
         return await interaction.editReply(
            "I don't have permission to send messages in the specified control channel."
         );
      }
      if (
         !category
            .permissionsFor(guild.members.me)
            .has(PermissionFlagsBits.ManageChannels)
      ) {
         return await interaction.editReply(
            "I don't have permission to manage channels in the specified category."
         );
      }

      const joinToCreateEmbed = new EmbedBuilder()
         .setTitle('Join-to-Create System')
         .setDescription(
            'Join the voice channel to create a new voice channel.'
         )
         .setColor('Blue')
         .setFooter({ text: 'Join-to-Create' })
         .setTimestamp();

      const joinToSystemSetupEmbed = new EmbedBuilder()
         .setTitle('Join-to-Create System Setup')
         .setColor('Green')
         .setDescription(
            'Join-to-Create system setup complete with the following settings:'
         )
         .addFields(
            { name: 'Join Channel', value: `${joinChannel}`, inline: true },
            {
               name: 'Control Channel',
               value: `${controlChannel}`,
               inline: true,
            },
            { name: 'Category', value: `${category}`, inline: true }
         )
         .setTimestamp();

      const actionRow1 = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('select_owner')
            .setLabel('Owner')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👑'),
         new ButtonBuilder()
            .setCustomId('manage_members')
            .setLabel('Members')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👥'),
         new ButtonBuilder()
            .setCustomId('set_limit')
            .setLabel('Set Limit')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('⚙️'),
         new ButtonBuilder()
            .setCustomId('toggle_lock')
            .setLabel('Lock')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔒'),
         new ButtonBuilder()
            .setCustomId('rename_channel')
            .setLabel('Rename')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✏️')
      );

      const actionRow2 = new ActionRowBuilder().addComponents(
         new ButtonBuilder()
            .setCustomId('manage_roles')
            .setLabel('Roles')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👥'),
         new ButtonBuilder()
            .setCustomId('kick_user')
            .setLabel('Kick')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🛴'),
         new ButtonBuilder()
            .setCustomId('manage_talk_access')
            .setLabel('Talk Access')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎙️')
      );

      let setup = await JoinToSystem.findOne({ guildId: guild.id });

      if (setup) {
         setup.joinToCreateChannelId = joinChannel.id;
         setup.controlChannelId = controlChannel.id;
         setup.categoryId = category.id;
      } else {
         setup = new JoinToSystem({
            guildId: guild.id,
            joinToCreateChannelId: joinChannel.id,
            controlChannelId: controlChannel.id,
            categoryId: category.id,
         });
      }

      await setup.save();

      await controlChannel.send({
         embeds: [joinToCreateEmbed],
         components: [actionRow1, actionRow2],
      });

      await interaction.editReply({
         content: 'Join-to-create system setup successful!',
         embeds: [joinToSystemSetupEmbed],
      });
   } catch (error) {
      console.error('Error during join-to-create setup:', error);
      await interaction.editReply({
         content:
            'There was an error during the join-to-create setup. Please check my permissions and try again.',
         ephemeral: true,
      });
   }
}

async function handleRemove(interaction) {
   try {
      const { guild } = interaction;

      await interaction.deferReply({ ephemeral: true });

      const setup = await JoinToSystem.findOneAndDelete({
         guildId: guild.id,
      });

      if (!setup) {
         return await interaction.editReply({
            content: 'No join-to-create setup found for this guild.',
            ephemeral: true,
         });
      }

      await interaction.editReply({
         content: 'Join-to-create system setup has been removed for the guild.',
         ephemeral: true,
      });
   } catch (error) {
      console.error('Error during join-to-create removal:', error);
      await interaction.editReply({
         content:
            'There was an error during the removal of the join-to-create setup. Please try again later.',
         ephemeral: true,
      });
   }
}
