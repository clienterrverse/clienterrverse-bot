import {
   SlashCommandBuilder,
   ModalBuilder,
   TextInputBuilder,
   TextInputStyle,
   ActionRowBuilder,
} from 'discord.js';
import Guild from '../../schemas/guildSchema.js'; // Adjust the path if necessary

export default {
   data: new SlashCommandBuilder()
      .setName('guild')
      .setDescription('Guild commands')
      .addSubcommand((subcommand) =>
         subcommand.setName('join').setDescription('Request to join the guild')
      )
      .toJSON(),
   nwfwMode: false,
   testMode: false,
   devOnly: false,
   cooldown: 5,
   userPermissionsBitField: [],
   bot: [],
   category: 'Misc',

   run: async (client, interaction) => {
      if (interaction.options.getSubcommand() === 'join') {
         try {
            const guild = await Guild.findOne();

            if (!guild) {
               return interaction.reply({
                  content: 'No guild found.',
                  ephemeral: true,
               });
            }

            if (
               guild.members.includes(interaction.user.id) ||
               guild.pendingMembers.some(
                  (member) => member.userId === interaction.user.id
               )
            ) {
               return interaction.reply({
                  content:
                     'You are already a member or have a pending request for the guild.',
                  ephemeral: true,
               });
            }

            const modal = new ModalBuilder()
               .setCustomId('guild-join')
               .setTitle('Guild Join Request');

            const ignInput = new TextInputBuilder()
               .setCustomId('ign')
               .setLabel("What's your Hypixel IGN?")
               .setStyle(TextInputStyle.Short)
               .setRequired(true)
               .setMinLength(1)
               .setMaxLength(16);

            const reasonInput = new TextInputBuilder()
               .setCustomId('reason')
               .setLabel('Why do you want to join this guild?')
               .setStyle(TextInputStyle.Paragraph)
               .setRequired(true)
               .setMinLength(1)
               .setMaxLength(200);

            modal.addComponents(
               new ActionRowBuilder().addComponents(ignInput),
               new ActionRowBuilder().addComponents(reasonInput)
            );

            await interaction.showModal(modal);
         } catch (error) {
            return interaction.reply({
               content: 'An error occurred while processing your request.',
               ephemeral: true,
            });
            throw error;
         }
      }
   },
};
