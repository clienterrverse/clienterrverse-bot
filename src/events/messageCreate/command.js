import { Collection, EmbedBuilder, PermissionsBitField } from 'discord.js';
import { config } from '../../config/config.js';
import mConfig from '../../config/messageConfig.js';
import { convertSlashCommandsToPrefix } from '../../utils/SlashCommandtoPrifix.js';
import { UserPrefix } from '../../schemas/prefix.js';

const { maintenance, developersId, testServerId } = config;
const cooldowns = new Collection();
const commandMap = new Map();

let prefixCommandsLoaded = false;

export default async (client, errorHandler, message) => {
  try {
    const { prefix, isExempt } = await getUserPrefixInfo(message.author.id);

    if (!isExempt && !message.content.startsWith(prefix)) return;

    const commandContent = isExempt
      ? message.content
      : message.content.slice(prefix.length);

    await loadPrefixCommandsIfNeeded(client);

    const { commandName, args } = parseCommand(commandContent);
    const command = findCommand(commandName);

    if (!command) return;

    await executeCommand(client, message, command, args, errorHandler);
  } catch (error) {
    console.error('Error in command handler:', error);
    await sendEmbedReply(
      message,
      mConfig.embedColorError,
      'An unexpected error occurred. Please try again later.'
    );
  }
};

async function getUserPrefixInfo(userId) {
  try {
    const userPrefixData = await UserPrefix.findOne({ userId });
    return {
      prefix: userPrefixData?.prefix || '!',
      isExempt: userPrefixData?.exemptFromPrefix || false,
    };
  } catch (error) {
    console.error('Error fetching user prefix:', error);
    return { prefix: '!', isExempt: false };
  }
}

async function loadPrefixCommandsIfNeeded(client) {
  if (prefixCommandsLoaded) return;

  try {
    client.prefixCommands = await convertSlashCommandsToPrefix();
    client.prefixCommands.forEach((cmd) => commandMap.set(cmd.name, cmd));
    prefixCommandsLoaded = true;
  } catch (error) {
    console.error('Error loading prefix commands:', error);
    throw new Error('Failed to load prefix commands');
  }
}

function parseCommand(content) {
  const args = content.trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  return { commandName, args };
}

function findCommand(commandName) {
  return (
    commandMap.get(commandName) ||
    Array.from(commandMap.values()).find(
      (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
    )
  );
}

async function executeCommand(client, message, command, args, errorHandler) {
  try {
    if (!checkCommandPrerequisites(message, command)) return;

    const cooldown = applyCooldown(
      message.author.id,
      command.name,
      (command.cooldown || 3) * 1000
    );
    if (cooldown.active) {
      return sendEmbedReply(
        message,
        mConfig.embedColorError,
        mConfig.commandCooldown.replace('{time}', cooldown.timeLeft)
      );
    }

    await command.run(client, message, args);
    console.log(`Command executed: ${command.name} by ${message.author.tag}`);
  } catch (err) {
    await handleCommandError(err, command, message, errorHandler);
  }
}

function checkCommandPrerequisites(message, command) {
  if (maintenance && !developersId.includes(message.author.id)) {
    sendEmbedReply(
      message,
      mConfig.embedColorError,
      'Bot is currently in maintenance mode. Please try again later.'
    );
    return false;
  }

  if (command.devOnly && !developersId.includes(message.author.id)) {
    sendEmbedReply(message, mConfig.embedColorError, mConfig.commandDevOnly);
    return false;
  }

  if (command.testMode && message.guild?.id !== testServerId) {
    sendEmbedReply(message, mConfig.embedColorError, mConfig.commandTestMode);
    return false;
  }

  if (command.nsfwMode && !message.channel.nsfw) {
    sendEmbedReply(message, mConfig.embedColorError, mConfig.nsfw);
    return false;
  }

  if (
    command.userPermissions?.length &&
    !checkPermissions(message, command.userPermissions, 'user')
  ) {
    sendEmbedReply(message, mConfig.embedColorError, mConfig.userNoPermissions);
    return false;
  }

  if (
    command.botPermissions?.length &&
    !checkPermissions(message, command.botPermissions, 'bot')
  ) {
    sendEmbedReply(message, mConfig.embedColorError, mConfig.botNoPermissions);
    return false;
  }

  return true;
}

async function handleCommandError(err, command, message, errorHandler) {
  await errorHandler.handleError(err, {
    type: 'prefixcommandError',
    commandName: command.name,
    userId: message.author.id,
    guildId: message.guild?.id,
  });

  sendEmbedReply(
    message,
    mConfig.embedColorError,
    'An error occurred while executing the command.'
  );
}

const sendEmbedReply = async (message, color, description) => {
  try {
    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(description)
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    if (message.guild) {
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.author.send({ embeds: [embed] });
    }
  } catch (err) {
    console.error('Error sending embed reply:', err);
  }
};

function checkPermissions(message, requiredPermissions, type) {
  if (!message.guild) return true;

  const member = type === 'user' ? message.member : message.guild.members.me;
  return requiredPermissions.every(
    (permission) =>
      PermissionsBitField.Flags[permission] !== undefined &&
      member.permissions.has(PermissionsBitField.Flags[permission])
  );
}

function applyCooldown(userId, commandName, cooldownTime) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = cooldownTime;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return { active: true, timeLeft: timeLeft.toFixed(1) };
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);

  return { active: false };
}
