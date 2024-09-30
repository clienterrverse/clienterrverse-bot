import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { profileImage } from 'discord-arts';
import Welcome from '../../schemas/welcomeSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKGROUND_PATH = path.join(
  __dirname,
  '..',
  '..',
  'assets',
  'welcome.png'
);
const DEFAULT_WELCOME_MESSAGE = 'Welcome to our server, {user}!';

/**
 * Handles the welcome event for a new guild member.
 *
 * This function is responsible for sending a welcome message to a new member
 * in a specified channel. It also assigns an auto-role if configured.
 *
 * @param {Client} client - The Discord client instance.
 * @param {ErrorHandler} errorHandler - The error handler instance.
 * @param {GuildMember} member - The new guild member.
 */
export default async (client, errorHandler, member) => {
  try {
    const welcomeSettings = await getWelcomeSettings(member.guild.id);
    if (!welcomeSettings?.enabled) return;

    const { welcomeChannel, autoRole } = await getGuildResources(
      member.guild,
      welcomeSettings
    );
    if (!welcomeChannel) return;

    const welcomeImage = await generateWelcomeImage(member);
    const embed = createWelcomeEmbed(member, welcomeSettings, welcomeImage);

    await sendWelcomeMessage(welcomeChannel, member, embed, welcomeImage);
    if (autoRole) await assignAutoRole(member, autoRole);
  } catch (error) {
    handleError(errorHandler, error, 'Welcome Event', member);
  }
};

/**
 * Fetches welcome settings from the database for a given guild.
 *
 * @param {string} guildId - The ID of the guild.
 * @returns {Promise<WelcomeSettings>} - A promise that resolves to the welcome settings.
 */
async function getWelcomeSettings(guildId) {
  try {
    return await Welcome.findOne({ guildId });
  } catch (error) {
    console.error('Error fetching welcome settings:', error);
    return null;
  }
}

/**
 * Retrieves the welcome channel and auto-role based on the welcome settings.
 *
 * @param {Guild} guild - The guild instance.
 * @param {WelcomeSettings} welcomeSettings - The welcome settings.
 * @returns {Promise<{welcomeChannel: Channel, autoRole: Role}>} - A promise that resolves to an object containing the welcome channel and auto-role.
 */
async function getGuildResources(guild, welcomeSettings) {
  const welcomeChannel = guild.channels.cache.get(welcomeSettings.channelId);
  const autoRole = guild.roles.cache.get(welcomeSettings.roleId);

  if (!welcomeChannel) {
    console.warn(
      `Welcome channel with ID ${welcomeSettings.channelId} not found in guild ${guild.id}.`
    );
  }

  if (!autoRole) {
    console.warn(
      `Auto role with ID ${welcomeSettings.roleId} not found in guild ${guild.id}.`
    );
  }

  return { welcomeChannel, autoRole };
}

/**
 * Generates a welcome image for the new member using the profileImage function.
 *
 * @param {GuildMember} member - The new guild member.
 * @returns {Promise<Buffer>} - A promise that resolves to the welcome image buffer.
 */
async function generateWelcomeImage(member) {
  try {
    return await profileImage(member.user.id, {
      customTag: `Member #${member.guild.memberCount}`,
      customBackground: BACKGROUND_PATH,
    });
  } catch (error) {
    console.error('Error generating welcome image:', error);
    return null;
  }
}

/**
 * Creates a welcome embed with the specified settings.
 *
 * @param {GuildMember} member - The new guild member.
 * @param {WelcomeSettings} welcomeSettings - The welcome settings.
 * @param {Buffer} welcomeImage - The welcome image buffer.
 * @returns {EmbedBuilder} - The welcome embed.
 */
function createWelcomeEmbed(member, welcomeSettings, welcomeImage) {
  const welcomeMessage = (
    welcomeSettings.message || DEFAULT_WELCOME_MESSAGE
  ).replace('{user}', `<@${member.id}>`);

  const embed = new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(welcomeMessage)
    .setTimestamp()
    .setFooter({ text: `Joined: ${member.joinedAt.toUTCString()}` });

  if (welcomeImage) {
    embed.setImage('attachment://welcome-image.png');
  }

  return embed;
}

/**
 * Sends the welcome message to the specified channel.
 *
 * @param {Channel} channel - The channel to send the welcome message to.
 * @param {GuildMember} member - The new guild member.
 * @param {EmbedBuilder} embed - The welcome embed.
 * @param {Buffer} welcomeImage - The welcome image buffer.
 */
async function sendWelcomeMessage(channel, member, embed, welcomeImage) {
  const messageOptions = {
    content: `Hey everyone, please welcome <@${member.id}>!`,
    embeds: [embed],
  };

  if (welcomeImage) {
    const attachment = new AttachmentBuilder(welcomeImage, {
      name: 'welcome-image.png',
    });
    messageOptions.files = [attachment];
  }

  try {
    await channel.send(messageOptions);
  } catch (error) {
    console.error('Error sending welcome message:', error);
  }
}

/**
 * Assigns the auto-role to the new member.
 *
 * @param {GuildMember} member - The new guild member.
 * @param {Role} role - The auto-role to assign.
 */
async function assignAutoRole(member, role) {
  try {
    await member.roles.add(role);
  } catch (error) {
    console.error(`Error assigning auto role to member ${member.id}:`, error);
  }
}

/**
 * Handles errors and logs them appropriately.
 *
 * @param {ErrorHandler} errorHandler - The error handler instance.
 * @param {Error} error - The error to handle.
 * @param {string} eventType - The type of event that triggered the error.
 * @param {GuildMember} member - The guild member related to the error.
 */
function handleError(errorHandler, error, eventType, member) {
  console.error(`Error in ${eventType} for member ${member.id}:`, error);
  errorHandler.handleError(error, {
    type: eventType,
    memberId: member.id,
    guildId: member.guild.id,
  });
}
