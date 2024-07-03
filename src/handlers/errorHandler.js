import { Client, WebhookClient, EmbedBuilder, Events } from 'discord.js';
import { AsyncLocalStorage } from 'async_hooks';
import { formatISO } from 'date-fns';

class DiscordBotErrorHandler {
    constructor(config) {
        this.config = {
            webhookUrl: process.env.ERROR_WEBHOOK_URL,
            maxCacheSize: 100,
            rateLimitWindow: 60000,
            maxErrorsPerWindow: 10,
            retryAttempts: 3,
            retryDelay: 1000,
            ...config
        };

        this.webhookClient = new WebhookClient({ url: this.config.webhookUrl });
        this.errorCache = new Set();
        this.rateLimit = { count: 0, lastReset: Date.now() };
        this.errorQueue = [];
        this.processingQueue = false;
        this.asyncLocalStorage = new AsyncLocalStorage();
        this.errorPatterns = new Map();
        this.anomalyDetector = new AnomalyDetector();
    }

    initialize(client) {
        this.client = client;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.client.on(Events.Error, (error) => this.handleError(error, { type: 'clientError' }));
        this.client.on(Events.Warn, (info) => this.handleError(new Error(info), { type: 'clientWarning', severity: 'Warning' }));
        process.on('unhandledRejection', (reason, promise) => this.handleError(reason, { type: 'unhandledRejection', promise }));
        process.on('uncaughtException', (error) => this.handleError(error, { type: 'uncaughtException' }));
    }

    async handleError(error, context = {}) {
        try {
            const errorDetails = await this.formatErrorDetails(error, context);
            await this.processError(errorDetails);
        } catch (err) {
            console.error('Failed to handle error:', err);
        }
    }

    async formatErrorDetails(error, context) {
        const asyncContext = this.asyncLocalStorage.getStore() || {};
        return {
            timestamp: formatISO(new Date()),
            message: error.message,
            stackTrace: this.cleanStackTrace(error.stack),
            context: await this.captureContext(context, asyncContext),
            category: this.determineErrorCategory(error),
            severity: this.determineErrorSeverity(error),
            performance: this.capturePerformanceMetrics(),
            environment: {
                nodeVersion: process.version,
                discordJsVersion: require('discord.js').version,
                botUptime: this.client.uptime,
            },
        };
    }

    cleanStackTrace(stack) {
        return stack.split('\n')
            .filter(line => !line.includes('node_modules'))
            .slice(0, 10)
            .join('\n');
    }

    async captureContext(providedContext, asyncContext) {
        const guildContext = await this.getGuildContext();
        const userContext = await this.getUserContext();
        return {
            ...providedContext,
            ...asyncContext,
            guild: guildContext,
            user: userContext,
        };
    }

    async getGuildContext() {
        const store = this.asyncLocalStorage.getStore();
        const guildId = store?.get('guildId');
        if (guildId) {
            const guild = await this.client.guilds.fetch(guildId);
            return {
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
            };
        }
        return null;
    }

    async getUserContext() {
        const store = this.asyncLocalStorage.getStore();
        const userId = store?.get('userId');
        if (userId) {
            const user = await this.client.users.fetch(userId);
            return {
                id: user.id,
                tag: user.tag,
                createdAt: user.createdAt,
            };
        }
        return null;
    }

    determineErrorCategory(error) {
        for (const [pattern, category] of this.errorPatterns) {
            if (pattern.test(error.message)) {
                return category;
            }
        }
        if (error.message.includes('API')) return 'Discord API Error';
        if (error.message.includes('permission')) return 'Permission Error';
        return 'Unknown Error';
    }

    determineErrorSeverity(error) {
        if (error.critical) return 'Critical';
        if (error instanceof TypeError) return 'Warning';
        if (error.message.includes('rate limit')) return 'Major';
        if (error.message.includes('unknown')) return 'Minor';
        return 'Moderate';
    }

    capturePerformanceMetrics() {
        const memoryUsage = process.memoryUsage();
        return {
            heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
            heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
            uptime: this.client.uptime + ' ms',
            guildCount: this.client.guilds.cache.size,
            userCount: this.client.users.cache.size,
        };
    }

    async processError(errorDetails) {
        if (this.shouldReportError(errorDetails)) {
            this.errorQueue.push(errorDetails);
            if (!this.processingQueue) {
                this.processingQueue = true;
                await this.processErrorQueue();
            }
        }
        this.anomalyDetector.addError(errorDetails);
    }

    shouldReportError(errorDetails) {
        const errorSignature = `${errorDetails.message}:${errorDetails.stackTrace.split('\n')[1]}`;
        
        if (this.errorCache.has(errorSignature)) return false;
        
        this.errorCache.add(errorSignature);
        if (this.errorCache.size > this.config.maxCacheSize) {
            const firstItem = this.errorCache.values().next().value;
            this.errorCache.delete(firstItem);
        }
        
        return this.isWithinRateLimit();
    }

    isWithinRateLimit() {
        const now = Date.now();
        if (now - this.rateLimit.lastReset > this.config.rateLimitWindow) {
            this.rateLimit.count = 0;
            this.rateLimit.lastReset = now;
        }
        
        if (this.rateLimit.count < this.config.maxErrorsPerWindow) {
            this.rateLimit.count++;
            return true;
        }
        
        return false;
    }

    async processErrorQueue() {
        while (this.errorQueue.length > 0) {
            const errorDetails = this.errorQueue.shift();
            await this.sendErrorToWebhook(errorDetails);
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
                        { name: 'Stack Trace', value: `\`\`\`${errorDetails.stackTrace}\`\`\``, inline: false },
                        { name: 'Context', value: `\`\`\`json\n${JSON.stringify(errorDetails.context, null, 2)}\`\`\``, inline: false },
                        { name: 'Performance', value: `\`\`\`json\n${JSON.stringify(errorDetails.performance, null, 2)}\`\`\``, inline: false }
                    )
                    .setTimestamp(new Date(errorDetails.timestamp))
                    .setFooter({ text: `Environment: ${errorDetails.environment.nodeVersion}` });

                await this.webhookClient.send({
                    content: `New ${errorDetails.severity} error reported`,
                    embeds: [embed],
                });
                return;
            } catch (err) {
                console.error(`Failed to send error to webhook (attempt ${attempt + 1}):`, err);
                if (attempt < this.config.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                }
            }
        }
    }

    getColorForSeverity(severity) {
        const colors = {
            'Minor': 0xFFA500,
            'Moderate': 0xFF4500,
            'Major': 0xFF0000,
            'Critical': 0x8B0000,
            'Warning': 0xFFFF00,
        };
        return colors[severity] || 0x000000;
    }

    addErrorPattern(pattern, category) {
        this.errorPatterns.set(pattern, category);
    }

    wrapAsync(fn) {
        return async (...args) => {
            const store = new Map();
            return this.asyncLocalStorage.run(store, async () => {
                try {
                    return await fn(...args);
                } catch (error) {
                    await this.handleError(error);
                    throw error;
                }
            });
        };
    }

    wrapCommand(command) {
        return async (interaction) => {
            const store = new Map();
            store.set('guildId', interaction.guildId);
            store.set('userId', interaction.user.id);
            return this.asyncLocalStorage.run(store, async () => {
                try {
                    await command(interaction);
                } catch (error) {
                    await this.handleError(error, { command: interaction.commandName });
                    await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
                }
            });
        };
    }
}

class AnomalyDetector {
    constructor() {
        this.errorCounts = new Map();
        this.timeWindow = 3600000; // 1 hour
    }

    addError(errorDetails) {
        const now = Date.now();
        const key = `${errorDetails.category}:${errorDetails.severity}`;
        
        if (!this.errorCounts.has(key)) {
            this.errorCounts.set(key, []);
        }
        
        this.errorCounts.get(key).push(now);
        this.cleanOldErrors(key, now);
        
        if (this.isAnomaly(key)) {
            console.warn(`Anomaly detected for ${key}`);
            // Implement additional anomaly handling (e.g., alerting)
        }
    }

    cleanOldErrors(key, now) {
        const errors = this.errorCounts.get(key);
        const newErrors = errors.filter(time => now - time < this.timeWindow);
        this.errorCounts.set(key, newErrors);
    }

    isAnomaly(key) {
        const errors = this.errorCounts.get(key);
        const threshold = 10; // Define your threshold
        return errors.length > threshold;
    }
}


export default DiscordBotErrorHandler;
