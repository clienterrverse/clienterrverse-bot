import 'colors';
import { EmbedBuilder, Collection } from 'discord.js';
import config from '../../config/config.json' assert { type: 'json' };
import mConfig from '../../config/messageConfig.json' assert { type: 'json' };
import getLocalCommands from '../../utils/getLocalCommands.js';

// Command cooldowns
const cooldowns = new Collection();

export default async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const localCommands = await getLocalCommands();
  const { developersId, testServerId } = config;

  try {
    const commandObject = localCommands.find(
      (cmd) => cmd.data.name === interaction.commandName || cmd.aliases?.includes(interaction.commandName)
    );
    if (!commandObject) return;

    // Command Cooldown Check
    if (!cooldowns.has(commandObject.data.name)) {
      cooldowns.set(commandObject.data.name, new Collection());
    }
    const now = Date.now();
    const timestamps = cooldowns.get(commandObject.data.name);
    const cooldownAmount = (commandObject.cooldown || 3) * 1000;

    if (timestamps.has(interaction.member.id)) {
      const expirationTime = timestamps.get(interaction.member.id) + cooldownAmount;

      if (now < expirationTime) {
        const timeLeft = (expirationTime - now) / 1000;
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandCooldown.replace('{time}', timeLeft.toFixed(1))}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    timestamps.set(interaction.member.id, now);
    setTimeout(() => timestamps.delete(interaction.member.id), cooldownAmount);

    // Developer Only Check
    if (commandObject.devOnly) {
      if (!developersId.includes(interaction.member.id)) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandDevOnly}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    // Test Server Only Check
    if (commandObject.testMode) {
      if (interaction.guild.id !== testServerId) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.commandTestMode}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    // NSFW Channel Check
    if (commandObject.nwfwMode) {
      if (!interaction.channel.nsfw) {
        const rEmbed = new EmbedBuilder()
          .setColor(`${mConfig.embedColorError}`)
          .setDescription(`${mConfig.nsfw}`);
        interaction.reply({ embeds: [rEmbed], ephemeral: true });
        return;
      }
    }

    // User Permissions Check
    if (commandObject.userPermissions?.length) {
      for (const permission of commandObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          const rEmbed = new EmbedBuilder()
            .setColor(`${mConfig.embedColorError}`)
            .setDescription(`${mConfig.userNoPermissions}`);
          interaction.reply({ embeds: [rEmbed], ephemeral: true });
          return;
        }
      }
    }

    // Bot Permissions Check
    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me;
        if (!bot.permissions.has(permission)) {
          const rEmbed = new EmbedBuilder()
            .setColor(`${mConfig.embedColorError}`)
            .setDescription(`${mConfig.botNoPermissions}`);
          interaction.reply({ embeds: [rEmbed], ephemeral: true });
          return;
        }
      }
    }

    // Command Execution
    await commandObject.run(client, interaction);

    // Command Logging
    console.log(`Command executed: ${interaction.commandName} by ${interaction.member.user.tag}`);

  } catch (err) {
    console.error(`An error occurred while validating chat input commands! ${err}`.red);
    
    // Notify Admins
    const admin = await client.users.fetch(developersId); // assuming the first developerId is the main admin
    if (admin) {
      admin.send(`An error occurred: ${err.message}`);
    }
  }
};
