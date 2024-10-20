import { DiscordAPIError } from 'discord.js';
import crypto from 'crypto';

class ErrorUtils {
  static cleanStackTrace(error, limit = 10) {
    const stack = (error.stack || '')
      .split('\n')
      .filter(
        (line) => !line.includes('node_modules') && !line.includes('timers.js')
      )
      .slice(0, limit)
      .join('\n');

    const errorType = error.name ? `${error.name}: ` : '';
    return `\`\`\`${errorType}${stack}\`\`\``;
  }

  static determineErrorSeverity(error) {
    if (error instanceof DiscordAPIError) {
      const code = error.code;
      if ([40001, 40002, 40003, 50013, 50001, 50014].includes(code))
        return 'Critical';
      if (
        [
          10008, 10003, 30001, 30002, 30003, 30005, 30007, 30010, 30013, 30015,
          30016,
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

  static getColorForSeverity(severity) {
    const colors = {
      Minor: 0xffa500,
      Moderate: 0xff4500,
      Major: 0xff0000,
      Critical: 0x8b0000,
      Warning: 0xffff00,
    };
    return colors[severity] || 0x000000;
  }

  static generateErrorHash(errorDetails) {
    const { message, stackTrace, category, severity } = errorDetails;
    return crypto
      .createHash('md5')
      .update(`${message}${stackTrace}${category}${severity}`)
      .digest('hex');
  }

  static createErrorSummary(errors) {
    const messageCounts = {};
    for (const error of errors) {
      messageCounts[error.message] = (messageCounts[error.message] || 0) + 1;
    }

    return Object.entries(messageCounts)
      .map(([message, count]) => `${message} (${count} occurrences)`)
      .join('\n');
  }

  static isRateLimited(errorKey, errorRateLimit, config) {
    const now = Date.now();
    const errorTimes = errorRateLimit.get(errorKey) || [];

    // Remove old entries
    while (
      errorTimes.length > 0 &&
      errorTimes[0] < now - config.rateLimitPeriod
    ) {
      errorTimes.shift();
    }

    if (errorTimes.length >= config.rateLimitThreshold) {
      return true;
    }

    errorTimes.push(now);
    errorRateLimit.set(errorKey, errorTimes);
    return false;
  }

  static updateErrorTrend(errorDetails, errorTrends, config) {
    const trendKey = `${errorDetails.category}:${errorDetails.message}`;
    const now = Date.now();

    if (!errorTrends.has(trendKey)) {
      errorTrends.set(trendKey, []);
    }

    const trend = errorTrends.get(trendKey);
    trend.push(now);

    // Remove old entries
    while (trend.length > 0 && trend[0] < now - config.trendPeriod) {
      trend.shift();
    }
  }

  static isErrorTrending(errorDetails, errorTrends, config) {
    const trendKey = `${errorDetails.category}:${errorDetails.message}`;
    const trend = errorTrends.get(trendKey);
    return trend && trend.length >= config.trendThreshold;
  }

  static logErrorInDevelopment(errorDetails) {
    console.error('Error occurred in development:');
    console.error('Message:', errorDetails.message);
    console.error('Category:', errorDetails.category);
    console.error('Severity:', errorDetails.severity);
    console.error('Stack Trace:', errorDetails.stackTrace);
    console.error('Context:', JSON.stringify(errorDetails.context, null, 2));
    console.error(
      'Performance:',
      JSON.stringify(errorDetails.performance, null, 2)
    );
    console.error('Recovery Suggestions:', errorDetails.recoverySuggestions);
  }

  static async capturePerformanceMetrics(client) {
    if (!client) {
      console.error('Discord client is not initialized');
      return {};
    }

    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      guildCount: client.guilds?.cache?.size || 0,
      userCount: client.users?.cache?.size || 0,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
      cpuUsage: process.cpuUsage(),
      latency: `${client.ws.ping}ms`,
    };
  }
}

export default ErrorUtils;
