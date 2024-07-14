import {
   Client,
   WebhookClient,
   EmbedBuilder,
   Events,
   DiscordAPIError,
} from 'discord.js';
import { formatISO } from 'date-fns';
import Bottleneck from 'bottleneck';

class DiscordBotErrorHandler {
   constructor(config) {
      this.config = {
         webhookUrl: process.env.ERROR_WEBHOOK_URL,
         environment: process.env.NODE_ENV || 'development',
         maxCacheSize: 100,
         retryAttempts: 3,
         retryDelay: 1000,
         rateLimit: { maxConcurrent: 1, minTime: 2000 },
         clientName: 'unknown client',
         ...config,
      };

      if (!this.config.webhookUrl) {
         console.error(
            'ERROR_WEBHOOK_URL is not set in the environment variables'
         );
      } else {
         this.webhookClient = new WebhookClient({
            url: this.config.webhookUrl,
         });
      }

      this.errorCache = new Map();
      this.errorQueue = [];
      this.processingQueue = false;

      this.limiter = new Bottleneck(this.config.rateLimit);
   }

   initialize(client) {
      this.client = client;
      if (!this.client) {
         console.error('Discord client is not provided');
         return;
      }
      this.config.clientName =
         this.client.user?.username || this.config.clientName;
      this.setupEventListeners();
      this.client.ws.on('error', this.handleWebSocketError.bind(this));
   }

   setupEventListeners() {
      this.client.on(Events.Error, (error) =>
         this.handleError(error, { type: 'clientError' })
      );
      this.client.on(Events.Warn, (info) =>
         this.handleError(new Error(info), {
            type: 'clientWarning',
            severity: 'Warning',
         })
      );
      process.on('unhandledRejection', (reason) =>
         this.handleError(reason, { type: 'unhandledRejection' })
      );
      process.on('uncaughtException', (error) =>
         this.handleError(error, { type: 'uncaughtException' })
      );
   }
   handleWebSocketError(error) {
      this.handleError(error, { type: 'webSocketError' });
   }

   async handleError(error, context = {}) {
      try {
         const errorDetails = await this.formatErrorDetails(error, context);
         await this.processError(errorDetails);
      } catch (err) {
         console.error('Failed to handle error:', err);
      }
   }

   cleanStackTrace(error, limit = 10) {
      const stack = (error.stack || '')
         .split('\n')
         .filter(
            (line) =>
               !line.includes('node_modules') && !line.includes('timers.js')
         )
         .slice(0, limit)
         .join('\n');

      const errorType = error.name ? `${error.name}: ` : '';

      return `\`\`\`${errorType}${stack}\`\`\``;
   }

   async captureContext(providedContext) {
      const guildContext = await this.getGuildContext(providedContext.guildId);
      const userContext = await this.getUserContext(providedContext.userId);
      return {
         ...providedContext,
         guild: guildContext,
         user: userContext,
      };
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
            return {
               id: user.id,
               tag: user.tag,
               createdAt: user.createdAt,
            };
         } catch (error) {
            console.error('Failed to fetch user context:', error);
         }
      }
      return null;
   }

   determineErrorCategory(error) {
      const message = error.message.toLowerCase();

      if (message.includes('api')) return 'Discord API Error';
      if (message.includes('permission')) return 'Permission Error';
      if (message.includes('rate limit')) return 'Rate Limit Error';
      if (message.includes('network')) return 'Network Error';
      if (message.includes('validation')) return 'Validation Error';
      if (message.includes('timeout')) return 'Timeout Error';
      if (message.includes('not found')) return 'Not Found Error';
      if (message.includes('database')) return 'Database Error';
      if (message.includes('auth') || message.includes('token'))
         return 'Authentication Error';
      if (message.includes('connect') || message.includes('connection'))
         return 'Connection Error';
      if (message.includes('parse') || message.includes('syntax'))
         return 'Parsing Error';
      if (message.includes('memory')) return 'Memory Error';
      if (message.includes('disk') || message.includes('storage'))
         return 'Storage Error';
      if (message.includes('gateway')) return 'Gateway Error';
      if (message.includes('unexpected token')) return 'Unexpected Token Error';
      if (message.includes('invalid form body'))
         return 'Invalid Form Body Error';
      if (message.includes('unknown interaction'))
         return 'Unknown Interaction Error';
      if (
         error instanceof Error &&
         error.message === "Unhandled 'error' event emitted"
      )
         return 'WebSocket Error';

      return 'Unknown Error';
   }

   determineErrorSeverity(error) {
      if (error instanceof DiscordAPIError) {
         if (error.code === 50013) return 'Critical';
         if (error.code === 50001) return 'Critical';
         if (error.code === 10008) return 'Major';
         if (error.code === 10003) return 'Major';
         return 'Moderate';
      }
      if (
         error instanceof Error &&
         error.message === "Unhandled 'error' event emitted"
      )
         return 'Major';
      if (error.critical) return 'Critical';
      if (error instanceof TypeError) return 'Warning';
      if (error.message.includes('rate limit')) return 'Major';
      if (error.message.includes('unknown')) return 'Minor';
      return 'Moderate';
   }

   async capturePerformanceMetrics() {
      if (!this.client) {
         console.error('Discord client is not initialized');
         return {};
      }

      const memoryUsage = process.memoryUsage();
      return {
         heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
         heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
         guildCount: this.client.guilds?.cache?.size || 0,
         userCount: this.client.users?.cache?.size || 0,
      };
   }

   async processError(errorDetails) {
      const errorKey = `${errorDetails.category}:${errorDetails.message}`;
      if (this.errorCache.has(errorKey)) {
         this.updateErrorFrequency(errorKey);
      } else {
         this.errorCache.set(errorKey, {
            count: 1,
            lastOccurrence: new Date(),
         });
         this.errorQueue.push(errorDetails);
         if (this.errorCache.size > this.config.maxCacheSize) {
            const oldestError = [...this.errorCache.entries()].sort(
               (a, b) => a[1].lastOccurrence - b[1].lastOccurrence
            )[0][0];
            this.errorCache.delete(oldestError);
         }
      }

      if (!this.processingQueue) {
         this.processingQueue = true;
         await this.processErrorQueue();
      }
   }

   async processErrorQueue() {
      while (this.errorQueue.length > 0) {
         const errorDetails = this.errorQueue.shift();
         await this.limiter.schedule(() =>
            this.sendErrorToWebhook(errorDetails)
         );
      }
      this.processingQueue = false;
   }

   async sendErrorToWebhook(errorDetails) {
      for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
         try {
            const embed = new EmbedBuilder()
               .setColor(this.getColorForSeverity(errorDetails.severity))
               .setTitle(`${errorDetails.category} - ${errorDetails.severity}`)
               .setDescription(`\`\`\`${errorDetails.message}\`\`\``)
               .addFields(
                  {
                     name: 'Stack Trace',
                     value: `\`\`\`${errorDetails.stackTrace}\`\`\``,
                     inline: false,
                  },
                  {
                     name: 'Context',
                     value: `\`\`\`json\n${JSON.stringify(errorDetails.context, null, 2)}\`\`\``,
                     inline: false,
                  },
                  {
                     name: 'Performance',
                     value: `\`\`\`json\n${JSON.stringify(await errorDetails.performance, null, 2)}\`\`\``,
                     inline: false,
                  }
               )
               .setTimestamp(new Date(errorDetails.timestamp))
               .setFooter({
                  text: `Environment: ${errorDetails.environment.nodeVersion} | Client: ${errorDetails.environment.clientName}`,
               });

            await this.webhookClient.send({
               content: `New ${errorDetails.severity} error reported`,
               embeds: [embed],
            });
            return;
         } catch (err) {
            console.error(
               `Failed to send error to webhook (attempt ${attempt + 1}):`,
               err
            );
            if (attempt < this.config.retryAttempts - 1) {
               await new Promise((resolve) =>
                  setTimeout(resolve, this.config.retryDelay)
               );
            }
         }
      }
   }

   getColorForSeverity(severity) {
      const colors = {
         Minor: 0xffa500,
         Moderate: 0xff4500,
         Major: 0xff0000,
         Critical: 0x8b0000,
         Warning: 0xffff00,
      };
      return colors[severity] || 0x000000;
   }

   updateErrorFrequency(errorKey) {
      const errorInfo = this.errorCache.get(errorKey);
      errorInfo.count += 1;
      errorInfo.lastOccurrence = new Date();
      this.errorCache.set(errorKey, errorInfo);
   }

   async formatErrorDetails(error, context) {
      const fullContext = await this.captureContext(context);

      return {
         message: error.message || 'Unknown error',
         stackTrace: error.stack
            ? this.cleanStackTrace(error)
            : 'No stack trace available',
         category: this.determineErrorCategory(error),
         severity: this.determineErrorSeverity(error),
         context: fullContext,
         performance: await this.capturePerformanceMetrics(),
         timestamp: formatISO(new Date()),
         environment: {
            nodeVersion: process.version,
            clientName: this.config.clientName,
         },
      };
   }
}

export default DiscordBotErrorHandler;
