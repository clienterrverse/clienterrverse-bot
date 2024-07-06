import { SlashCommandBuilder, PermissionsBitField } from 'discord.js';

const noPingAdmins = new Set();
const warningCooldowns = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('disableping')
    .setDescription('Enable or disable the no-ping feature for administrators.')
    .addStringOption((option) =>
      option
        .setName('action')
        .setDescription('Choose enable or disable')
        .setRequired(true)
        .addChoices(
          { name: 'enable', value: 'enable' },
          { name: 'disable', value: 'disable' }
        )
    )
    .toJSON(),
  userPermissions: [PermissionsBitField.Flags.ADMINISTRATOR],
  botPermissions: [],
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    const action = interaction.options.getString('action');

    if (action === 'enable') {
      noPingAdmins.add(interaction.user.id);
      await interaction.reply({
        content:
          'No-ping feature enabled. Users will not be able to mention you.',
        ephemeral: true,
      });
    } else if (action === 'disable') {
      noPingAdmins.delete(interaction.user.id);
      await interaction.reply({
        content: 'No-ping feature disabled. Users can mention you now.',
        ephemeral: true,
      });
    }
  },

  checkMentions: async (client, message) => {
    if (message.mentions.users.size > 0) {
      message.mentions.users.forEach(async (user) => {
        if (noPingAdmins.has(user.id)) {
          const member = await message.guild.members.fetch(message.author.id);
          if (
            !member.permissions.has(PermissionsBitField.Flags.ADMINISTRATOR)
          ) {
            const now = Date.now();
            const userCooldown = warningCooldowns.get(user.id);

            if (!userCooldown || now - userCooldown > 10000) {
              try {
                await message.delete();
                await message.author.send(
                  `Please avoid mentioning admins in server: ${message.guild.name}.`
                );

                warningCooldowns.set(user.id, now);
              } catch (error) {
                console.error(
                  `Error sending warning message to ${message.author.username}: ${error.message}`
                );

                await message.channel.send(
                  `Unable to send a warning message to ${message.author.username} because they have direct messages disabled.`
                );
              }
            }
          }
        }
      });
    }
  },
};
