import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import { profileImage } from 'discord-arts';
import Welcome from '../../schemas/welcomeSchema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async (client, errorHandler, member) => {
   try {
      const guildId = member.guild.id;
      const welcomeSettings = await Welcome.findOne({ guildId });

      if (!welcomeSettings?.enabled) {
         return; // Welcome feature is not enabled for this guild
      }

      const welcomeChannel = member.guild.channels.cache.get(
         welcomeSettings.channelId
      );
      const autoRole = member.guild.roles.cache.get(welcomeSettings.roleId);

      if (!welcomeChannel) {
         throw new Error(
            `Welcome channel with ID ${welcomeSettings.channelId} not found.`
         );
      }

      if (!autoRole) {
         throw new Error(
            `Auto role with ID ${welcomeSettings.roleId} not found.`
         );
      }

      // Generate profile image
      const backgroundPath = path.join(
         __dirname,
         '..',
         '..',
         'assets',
         'welcome.png'
      );
      const img = await profileImage(member.user.id, {
         customTag: `Member #${member.guild.memberCount}`,
         customBackground: backgroundPath,
      });

      // Create an attachment from the generated image
      const attachment = new AttachmentBuilder(img, {
         name: 'welcome-image.png',
      });

      // Create an embed for the welcome message
      const embed = new EmbedBuilder()
         .setColor('#0099ff')
         .setTitle(`Welcome to ${member.guild.name}!`)
         .setDescription(
            welcomeSettings.message.replace('{user}', `<@${member.id}>`)
         )
         .setImage('attachment://welcome-image.png')
         .setTimestamp()
         .setFooter({ text: `Joined: ${member.joinedAt.toUTCString()}` });

      const welcomeMessage = await welcomeChannel.send({
         content: `Hey everyone, please welcome <@${member.id}>!`,
         embeds: [embed],
         files: [attachment],
      });

      await member.roles.add(autoRole);
   } catch (error) {
      errorHandler(error, 'Welcome Event');
   }
};
