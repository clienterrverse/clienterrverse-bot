import {
  Client,
  ChatInputCommandInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';


export default {
  customId: "addrole_modal",
  userPermissions: [PermissionFlagsBits.ManageRoles],
  botPermissions: [PermissionFlagsBits.ManageRoles],

  /**
   * @param {Client} client
   * @param {ChatInputCommandInteraction} interaction
   */

  run: async (client, interaction) => {
    try {
      const { message, channel, guildId, guild, user } = interaction;

      const embedAuthor = message.embeds[0].author;
      const fetchedMembers = await guild.members.fetch({
        query: embedAuthor.name,
        limit: 1,
      });
      const targetMember = fetchedMembers.first();

      const roleId = interaction.fields.getTextInputValue("role_id_input");
      const role = interaction.guild.roles.cache.get(roleId);

      await interaction.deferReply();

      const addedrole = new EmbedBuilder()
        .setAuthor({
          name: `${targetMember.user.username}`,
          iconURL: `${targetMember.user.displayAvatarURL({ dynamic: true })}`,
        })
        .setDescription(
          `**${role} has been added successfully to the ${targetMember}!**`
        );

      targetMember.roles.add(role).catch((err) => {
        console.error(err);
      });

      return interaction.editReply({
        embeds: [addedrole],
        components: [],
        ephemeral: true,
      });
    } catch (err) {
      console.error(err);
    }
  },
};
