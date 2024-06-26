import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import config from '../../config/config.json' assert { type: 'json' };
import mConfig from '../../config/messageConfig.json' assert { type: 'json' };
import getLocalCommands from '../../utils/getLocalCommands.js';

// Command cooldowns
const cooldowns = new Collection();

// Helper function to send embed replies
const sendEmbedReply = async (interaction, color, description, ephemeral = true) => {
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(description);
  await interaction.reply({ embeds: [embed], ephemeral });
};

export default async (client, interaction) => {
  if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

  const localCommands = await getLocalCommands();
  const { developersId, testServerId } = config;

  try {
    const commandObject = localCommands.find(
      cmd => cmd.data.name === interaction.commandName || cmd.aliases?.includes(interaction.commandName)
    );

    if (!commandObject) {
      return sendEmbedReply(interaction, mConfig.embedColorError, 'Command not found.');
    }

    // Handle Autocomplete Interaction Separately
    if (interaction.isAutocomplete()) {
      return await commandObject.autocomplete(client, interaction);
    }

    // Guild Check
    if (!interaction.guild && !commandObject.dmAllowed) {
      return sendEmbedReply(interaction, mConfig.embedColorError, 'This command can only be used within a server.');
    }

    if (!cooldowns.has(commandObject.data.name)) {
      cooldowns.set(commandObject.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(commandObject.data.name);
    const cooldownAmount = (commandObject.cooldown || 3) * 1000;

    if (timestamps.has(interaction.user.id)) {
      const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;
      if (now < expirationTime) {
        const timeLeft = ((expirationTime - now) / 1000).toFixed(1);
        return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandCooldown.replace('{time}', timeLeft));
      }
    }

    timestamps.set(interaction.user.id, now);
    setTimeout(() => {
      timestamps.delete(interaction.user.id);
    }, cooldownAmount);

    // Developer Only Check
    if (commandObject.devOnly && !developersId.includes(interaction.user.id)) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandDevOnly);
    }

    // Test Server Only Check
    if (commandObject.testMode && interaction.guild.id !== testServerId) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.commandTestMode);
    }

    // NSFW Channel Check
    if (commandObject.nsfwMode && !interaction.channel.nsfw) {
      return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.nsfw);
    }

    // User Permissions Check
    if (commandObject.userPermissions?.length) {
      for (const permission of commandObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.userNoPermissions);
        }
      }
    }

    // Bot Permissions Check
    if (commandObject.botPermissions?.length) {
      const bot = interaction.guild.members.me;
      for (const permission of commandObject.botPermissions) {
        if (!bot.permissions.has(permission)) {
          return sendEmbedReply(interaction, mConfig.embedColorError, mConfig.botNoPermissions);
        }
      }
    }

    // Execute the command
    await commandObject.run(client, interaction);

    // Command Logging
    console.log(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`.green);
  } catch (err) {
    console.error(`An error occurred while processing command: ${interaction.commandName}. Error: ${err.message}`.red);
    sendEmbedReply(interaction, mConfig.embedColorError, 'An error occurred while processing the command.');
  }
};
