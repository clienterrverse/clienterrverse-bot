import {
   WebhookClient,
   EmbedBuilder,
   Events,
   DiscordAPIError,
   Client,
} from 'discord.js';
import Bottleneck from 'bottleneck';
import crypto from 'crypto';
import determineErrorCategory from '../utils/error/determineErrorCategory.js';
import getRecoverySuggestions from '../utils/error/getRecoverySuggestions.js';
class DiscordBotErrorHandler {
   constructor(config) {
      this.config = {
         webhookUrl: process.env.ERROR_WEBHOOK_URL,
         environment: process.env.NODE_ENV || 'development',
         maxCacheSize: 100,
         retryAttempts: 3,
         retryDelay: 1000,
         rateLimit: { maxConcurrent: 1, minTime: 2000 },
         clientName: '',
         rateLimitThreshold: 5,
         rateLimitPeriod: 60000, // 1 minute
         groupThreshold: 5,
         trendThreshold: 3,
         trendPeriod: 3600000, // 1 hour
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
      this.errorRateLimit = new Map();
      this.errorGroups = new Map();
      this.errorTrends = new Map();

      this.limiter = new Bottleneck(this.config.rateLimit);
   }

   initialize(client) {
      this.client = client;
      if (!this.client) {
         console.error('Discord client is not provided');
         return;
      }
      this.setupEventListeners();
      this.client.ws.on('error', this.handleWebSocketError.bind(this));
   }

   setupEventListeners() {
      this.client.on(Events.ClientReady, (client) => {
         this.config.clientName =
            this.client.user?.username || this.config.clientName;
      });
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

   determineErrorSeverity(error) {
      if (error instanceof DiscordAPIError) {
         const code = error.code;
         if ([40001, 40002, 40003, 50013, 50001, 50014].includes(code))
            return 'Critical';
         if (
            [
               10008, 10003, 30001, 30002, 30003, 30005, 30007, 30010, 30013,
               30015, 30016,
            ].includes(code)
         )
            return 'Major';
         if ([50035, 50041, 50045, 50046].includes(code)) return 'Moderate';
         return 'Minor';
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
      const uptime = process.uptime();

      return {
         heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
         heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
         guildCount: this.client.guilds?.cache?.size || 0,
         userCount: this.client.users?.cache?.size || 0,
         uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
         cpuUsage: process.cpuUsage(),
         latency: `${this.client.ws.ping}ms`,
      };
   }

   async processError(errorDetails) {
      const errorKey = `${errorDetails.category}:${errorDetails.message}`;

      if (this.isRateLimited(errorKey)) {
         console.log(`Error rate-limited: ${errorKey}`);
         return;
      }

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

      this.updateErrorTrend(errorDetails);

      if (this.isErrorTrending(errorDetails)) {
         await this.sendTrendAlert(errorDetails);
      }

      if (!this.processingQueue) {
         this.processingQueue = true;
         await this.processErrorQueue();
      }
   }

   isRateLimited(errorKey) {
      const now = Date.now();
      const errorTimes = this.errorRateLimit.get(errorKey) || [];

      // Remove old entries
      while (
         errorTimes.length > 0 &&
         errorTimes[0] < now - this.config.rateLimitPeriod
      ) {
         errorTimes.shift();
      }

      if (errorTimes.length >= this.config.rateLimitThreshold) {
         return true;
      }

      errorTimes.push(now);
      this.errorRateLimit.set(errorKey, errorTimes);
      return false;
   }

   async processErrorQueue() {
      const processedErrors = new Set();

      while (this.errorQueue.length > 0) {
         const errorDetails = this.errorQueue.shift();
         const errorHash = this.generateErrorHash(errorDetails);

         if (!processedErrors.has(errorHash)) {
            this.addToErrorGroup(errorDetails);
            processedErrors.add(errorHash);
         }
      }

      await this.sendGroupedErrors();
      this.processingQueue = false;
   }

   generateErrorHash(errorDetails) {
      const { message, stackTrace, category, severity } = errorDetails;
      return crypto
         .createHash('md5')
         .update(`${message}${stackTrace}${category}${severity}`)
         .digest('hex');
   }

   addToErrorGroup(errorDetails) {
      const groupKey = `${errorDetails.category}:${errorDetails.severity}`;
      if (!this.errorGroups.has(groupKey)) {
         this.errorGroups.set(groupKey, []);
      }
      this.errorGroups.get(groupKey).push(errorDetails);
   }

   async sendGroupedErrors() {
      for (const [groupKey, errors] of this.errorGroups.entries()) {
         if (errors.length >= this.config.groupThreshold) {
            await this.sendGroupedErrorToWebhook(groupKey, errors);
         } else {
            for (const error of errors) {
               await this.limiter.schedule(() =>
                  this.sendErrorToWebhook(error)
               );
            }
         }
      }
      this.errorGroups.clear();
   }

   async sendGroupedErrorToWebhook(groupKey, errors) {
      const [category, severity] = groupKey.split(':');
      const summary = this.createErrorSummary(errors);

      const embed = new EmbedBuilder()
         .setColor(this.getColorForSeverity(severity))
         .setTitle(`Grouped ${category} Errors - ${severity}`)
         .setDescription(summary)
         .addFields(
            {
               name: 'Error Count',
               value: errors.length.toString(),
               inline: true,
            },
            {
               name: 'Time Range',
               value: `${new Date(errors[0].timestamp).toISOString()} - ${new Date(errors[errors.length - 1].timestamp).toISOString()}`,
               inline: true,
            }
         )
         .setTimestamp();

      await this.webhookClient.send({
         content: `Grouped ${severity} errors reported`,
         embeds: [embed],
      });
   }

   createErrorSummary(errors) {
      const messageCounts = {};
      for (const error of errors) {
         messageCounts[error.message] = (messageCounts[error.message] || 0) + 1;
      }

      return Object.entries(messageCounts)
         .map(([message, count]) => `${message} (${count} occurrences)`)
         .join('\n');
   }

   updateErrorTrend(errorDetails) {
      const trendKey = `${errorDetails.category}:${errorDetails.message}`;
      const now = Date.now();

      if (!this.errorTrends.has(trendKey)) {
         this.errorTrends.set(trendKey, []);
      }

      const trend = this.errorTrends.get(trendKey);
      trend.push(now);

      // Remove old entries
      while (trend.length > 0 && trend[0] < now - this.config.trendPeriod) {
         trend.shift();
      }
   }

   isErrorTrending(errorDetails) {
      const trendKey = `${errorDetails.category}:${errorDetails.message}`;
      const trend = this.errorTrends.get(trendKey);
      return trend && trend.length >= this.config.trendThreshold;
   }

   async sendTrendAlert(errorDetails) {
      const embed = new EmbedBuilder()
         .setColor(this.getColorForSeverity('Warning'))
         .setTitle('Error Trend Detected')
         .setDescription(
            `The following error is trending:\n\`\`\`${errorDetails.message}\`\`\``
         )
         .addFields(
            {
               name: 'Category',
               value: errorDetails.category,
               inline: true,
            },
            {
               name: 'Severity',
               value: errorDetails.severity,
               inline: true,
            },
            {
               name: 'Occurrences in the last hour',
               value: this.errorTrends
                  .get(`${errorDetails.category}:${errorDetails.message}`)
                  .length.toString(),
               inline: true,
            }
         )
         .setTimestamp();

      await this.webhookClient.send({
         content: 'Error trend alert',
         embeds: [embed],
      });
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
                  },
                  {
                     name: 'Recovery Suggestions',
                     value: errorDetails.recoverySuggestions,
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
      const recoverySuggestions = await getRecoverySuggestions(error);

      return {
         message: error.message || 'Unknown error',
         stackTrace: error.stack
            ? this.cleanStackTrace(error)
            : 'No stack trace available',
         category: determineErrorCategory(error),
         severity: this.determineErrorSeverity(error),
         context: fullContext,
         performance: await this.capturePerformanceMetrics(),
         timestamp: new Date().toISOString(),
         environment: {
            nodeVersion: process.version,
            clientName: this.config.clientName,
         },
         recoverySuggestions,
      };
   }
}

export default DiscordBotErrorHandler;
