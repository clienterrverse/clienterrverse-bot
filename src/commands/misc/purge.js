import { SlashCommandBuilder, PermissionsBitField } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete a specified number of messages.")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("Number of messages to delete")
        .setRequired(true)
    )
    .toJSON(),
  userPermissions: [PermissionsBitField.Flags.MANAGE_MESSAGES],
  botPermissions: [],
  cooldown: 5,
  nwfwMode: false,
  testMode: false,
  devOnly: false,

  run: async (client, interaction) => {
    const amount = interaction.options.getInteger("amount");

    // Check if the user has permission to manage messages
    if (
      !interaction.member.permissions.has(
        PermissionsBitField.Flags.MANAGE_MESSAGES
      )
    ) {
      return await interaction.reply({
        content: "You don't have permission to use this command.",
        ephemeral: true,
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return await interaction.reply({
        content: "Please enter a valid number of messages to delete.",
        ephemeral: true,
      });
    }

    if (amount > 100) {
      return await interaction.reply({
        content: "You can only delete up to 100 messages at a time.",
        ephemeral: true,
      });
    }

    // Defer the reply as deleting messages can take some time
    await interaction.deferReply({ ephemeral: true });

    try {
      const deletedMessages = await interaction.channel.bulkDelete(
        amount,
        true
      );
      await interaction.editReply({
        content: `Successfully deleted ${deletedMessages.size} messages.`,
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply({
        content: "There was an error trying to purge messages in this channel!",
      });
    }
  },
};
