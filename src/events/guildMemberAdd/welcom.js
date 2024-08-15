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
      errorHandler.handleError(error, {
         type: 'Welcome Event',
         memberId: member.id,
         guildId: member.guild.id,
      });
   }
};

async function getWelcomeSettings(guildId) {
   try {
      return await Welcome.findOne({ guildId });
   } catch (error) {
      console.error('Error fetching welcome settings:', error);
      return null;
   }
}

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

function createWelcomeEmbed(member, welcomeSettings, welcomeImage) {
   const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`Welcome to ${member.guild.name}!`)
      .setDescription(
         welcomeSettings.message?.replace('{user}', `<@${member.id}>`) ||
            DEFAULT_WELCOME_MESSAGE.replace('{user}', `<@${member.id}>`)
      )
      .setTimestamp()
      .setFooter({ text: `Joined: ${member.joinedAt.toUTCString()}` });

   if (welcomeImage) {
      embed.setImage('attachment://welcome-image.png');
   }

   return embed;
}

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

async function assignAutoRole(member, role) {
   try {
      await member.roles.add(role);
   } catch (error) {
      console.error(`Error assigning auto role to member ${member.id}:`, error);
   }
}
