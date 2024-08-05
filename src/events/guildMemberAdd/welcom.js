import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { profileImage } from 'discord-arts';
import Welcome from '../../schemas/welcomeSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKGROUND_PATH = path.join(__dirname, '..', '..', 'assets', 'welcome.png');

export default async (client, errorHandler, member) => {
  try {
    const welcomeSettings = await getWelcomeSettings(member.guild.id);
    if (!welcomeSettings?.enabled) return;

    const { welcomeChannel, autoRole } = await getGuildResources(member.guild, welcomeSettings);
    
    const welcomeImage = await generateWelcomeImage(member);
    const embed = createWelcomeEmbed(member, welcomeSettings, welcomeImage);
    
    await sendWelcomeMessage(welcomeChannel, member, embed, welcomeImage);
    await assignAutoRole(member, autoRole);
  } catch (error) {
    errorHandler.handleError(error, { type: 'Welcome Event' });
  }
};

async function getWelcomeSettings(guildId) {
  return await Welcome.findOne({ guildId });
}

async function getGuildResources(guild, welcomeSettings) {
  const welcomeChannel = guild.channels.cache.get(welcomeSettings.channelId);
  const autoRole = guild.roles.cache.get(welcomeSettings.roleId);

  if (!welcomeChannel) {
    throw new Error(`Welcome channel with ID ${welcomeSettings.channelId} not found.`);
  }

  if (!autoRole) {
    throw new Error(`Auto role with ID ${welcomeSettings.roleId} not found.`);
  }

  return { welcomeChannel, autoRole };
}

async function generateWelcomeImage(member) {
  return await profileImage(member.user.id, {
    customTag: `Member #${member.guild.memberCount}`,
    customBackground: BACKGROUND_PATH,
  });
}

function createWelcomeEmbed(member, welcomeSettings, welcomeImage) {
  const attachment = new AttachmentBuilder(welcomeImage, { name: 'welcome-image.png' });

  return new EmbedBuilder()
    .setColor('#0099ff')
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(welcomeSettings.message.replace('{user}', `<@${member.id}>`))
    .setImage('attachment://welcome-image.png')
    .setTimestamp()
    .setFooter({ text: `Joined: ${member.joinedAt.toUTCString()}` });
}

async function sendWelcomeMessage(channel, member, embed, welcomeImage) {
  const attachment = new AttachmentBuilder(welcomeImage, { name: 'welcome-image.png' });

  await channel.send({
    content: `Hey everyone, please welcome <@${member.id}>!`,
    embeds: [embed],
    files: [attachment],
  });
}

async function assignAutoRole(member, role) {
  await member.roles.add(role);
}