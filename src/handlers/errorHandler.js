import { WebhookClient, EmbedBuilder, Events, Client } from 'discord.js';
import Bottleneck from 'bottleneck';
import determineErrorCategory from '../utils/error/determineErrorCategory.js';
import getRecoverySuggestions from '../utils/error/getRecoverySuggestions.js';
import ContextService from '../utils/error/ContextService.js';
import ErrorUtils from '../utils/error/ErrorUtils.js';

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

    if (this.config.environment !== 'development' && this.config.webhookUrl) {
      this.webhookClient = new WebhookClient({ url: this.config.webhookUrl });
    } else if (!this.config.webhookUrl) {
      console.error(
        'ERROR_WEBHOOK_URL is not set in the environment variables'
      );
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
    this.contextService = new ContextService(this.client);
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
      if (this.config.environment === 'development') {
        ErrorUtils.logErrorInDevelopment(errorDetails);
        return;
      }
      await this.processError(errorDetails);
    } catch (err) {
      console.error('Failed to handle error:', err);
    }
  }

  async processError(errorDetails) {
    const errorKey = `${errorDetails.category}:${errorDetails.message}`;

    if (ErrorUtils.isRateLimited(errorKey, this.errorRateLimit, this.config)) {
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

    ErrorUtils.updateErrorTrend(errorDetails, this.errorTrends, this.config);

    if (
      ErrorUtils.isErrorTrending(errorDetails, this.errorTrends, this.config)
    ) {
      await this.sendTrendAlert(errorDetails);
    }

    if (!this.processingQueue) {
      this.processingQueue = true;
      await this.processErrorQueue();
    }
  }

  async processErrorQueue() {
    const processedErrors = new Set();

    while (this.errorQueue.length > 0) {
      const errorDetails = this.errorQueue.shift();
      const errorHash = ErrorUtils.generateErrorHash(errorDetails);

      if (!processedErrors.has(errorHash)) {
        this.addToErrorGroup(errorDetails);
        processedErrors.add(errorHash);
      }
    }

    await this.sendGroupedErrors();
    this.processingQueue = false;
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
          await this.limiter.schedule(() => this.sendErrorToWebhook(error));
        }
      }
    }
    this.errorGroups.clear();
  }

  async sendGroupedErrorToWebhook(groupKey, errors) {
    const [category, severity] = groupKey.split(':');
    const summary = ErrorUtils.createErrorSummary(errors);

    const embed = new EmbedBuilder()
      .setColor(ErrorUtils.getColorForSeverity(severity))
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

  async sendTrendAlert(errorDetails) {
    const embed = new EmbedBuilder()
      .setColor(ErrorUtils.getColorForSeverity('Warning'))
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
    if (this.config.environment === 'development') {
      ErrorUtils.logErrorInDevelopment(errorDetails);
      return;
    }
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        const embed = new EmbedBuilder()
          .setColor(ErrorUtils.getColorForSeverity(errorDetails.severity))
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

  updateErrorFrequency(errorKey) {
    const errorInfo = this.errorCache.get(errorKey);
    errorInfo.count += 1;
    errorInfo.lastOccurrence = new Date();
    this.errorCache.set(errorKey, errorInfo);
  }

  async formatErrorDetails(error, context) {
    const fullContext = await this.contextService.captureContext(context);
    const recoverySuggestions = await getRecoverySuggestions(error);

    return {
      message: error.message || 'Unknown error',
      stackTrace: ErrorUtils.cleanStackTrace(error),
      category: determineErrorCategory(error),
      severity: ErrorUtils.determineErrorSeverity(error),
      context: fullContext,
      performance: await ErrorUtils.capturePerformanceMetrics(this.client),
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
