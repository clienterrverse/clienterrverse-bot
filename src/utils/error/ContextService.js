import { Client } from 'discord.js';

class ContextService {
  constructor(client) {
    this.client = client;
  }

  async getChannelContext(channelId) {
    if (channelId) {
      try {
        const channel = await this.client.channels.fetch(channelId);
        return {
          id: channel.id,
          name: channel.name,
          type: channel.type,
          parentId: channel.parentId,
        };
      } catch (error) {
        console.error('Failed to fetch channel context:', error);
      }
    }
    return null;
  }

  async getGuildContext(guildId) {
    if (guildId) {
      try {
        const guild = await this.client.guilds.fetch(guildId);
        return {
          id: guild.id,
          name: guild.name,
          memberCount: guild.memberCount,
        };
      } catch (error) {
        console.error('Failed to fetch guild context:', error);
      }
    }
    return null;
  }

  async getUserContext(userId) {
    if (userId) {
      try {
        const user = await this.client.users.fetch(userId);
        return { id: user.id, tag: user.tag, createdAt: user.createdAt };
      } catch (error) {
        console.error('Failed to fetch user context:', error);
      }
    }
    return null;
  }

  async captureContext(providedContext) {
    const guildContext = await this.getGuildContext(providedContext.guildId);
    const userContext = await this.getUserContext(providedContext.userId);
    const channelContext = await this.getChannelContext(
      providedContext.channelId
    );

    return {
      ...providedContext,
      guild: guildContext,
      user: userContext,
      channel: channelContext,
      command: providedContext.command || 'Unknown',
      timestamp: new Date().toISOString(),
    };
  }
}

export default ContextService;
