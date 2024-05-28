import { WebhookClient, EmbedBuilder } from 'discord.js';
import mConfig from '../config/messageConfig.json' assert { type: 'json' };

const webhookURL = "https://discord.com/api/webhooks/1244716464280436850/tEwRfZ1w299i2JluRtqVFAPwmoxHRRDP-4gRbDd9MhlFsxNbQosSLyP2jE7XYdNL9io_";
const summaryWebhookURL = "https://discord.com/api/webhooks/1244716464280436850/tEwRfZ1w299i2JluRtqVFAPwmoxHRRDP-4gRbDd9MhlFsxNbQosSLyP2jE7XYdNL9io_";

if (!webhookURL || !summaryWebhookURL) {
    console.error("Error: Webhook URLs are not defined.");
    process.exit(1);
}

const webhook = new WebhookClient({ url: webhookURL });
const summaryWebhook = new WebhookClient({ url: summaryWebhookURL });

// Error tracking variables
let errorCounts = {};
const cooldownPeriod = 60000; // 1 minute cooldown period
const maxErrorsPerCooldown = 5; // Maximum 5 errors per cooldown period

/**
 * Generates an error summary report.
 */
async function generateErrorSummary(errorCounts) {
    const embed = new EmbedBuilder()
        .setColor(mConfig.embedColorDefault)
        .setTitle("Error Summary Report")
        .setDescription("Summary of errors that occurred in the last 24 hours:");

    // Calculate total number of errors
    let totalErrors = 0;
    for (const errorType in errorCounts) {
        totalErrors += errorCounts[errorType];
    }

    embed.addFields({ name: "Total Errors", value: String(totalErrors) });

    // Add individual error type counts
    for (const errorType in errorCounts) {
        embed.addFields({ name: errorType, value: String(errorCounts[errorType]), inline: true });
    }

    return embed;
}

/**
 * Sends the daily error summary report and resets error counts.
 */
async function sendDailyErrorSummaryReport(errorCounts) {
    try {
        const embed = await generateErrorSummary(errorCounts);
        await summaryWebhook.send({ embeds: [embed] });

        // Reset error counts for the next day
        resetErrorCounts(errorCounts);
    } catch (error) {
        console.error("Failed to send daily error summary report:", error);
    }
}

/**
 * Resets the error counts.
 */
function resetErrorCounts(errorCounts) {
    for (const errorType in errorCounts) {
        errorCounts[errorType] = 0;
    }
}

/**
 * Logs an error and sends it to the webhook.
 */
async function logError(errorType, error, additionalInfo = {}) {
    const formattedStack = error.stack.length > 2048 ? error.stack.slice(0, 2045) + "..." : error.stack;

    const embed = new EmbedBuilder()
        .setColor(mConfig.embedColorError)
        .setTitle(`${errorType}`)
        .setDescription("```diff\n- " + formattedStack + "\n```")
        .setTimestamp(new Date())
        .addFields(Object.entries(additionalInfo).map(([key, value]) => ({ name: key, value: String(value) })));

    try {
        await webhook.send({ embeds: [embed] });
    } catch (webhookError) {
        console.error("Failed to send error log to webhook:", webhookError);
    }
}

/**
 * Determines whether an error should be logged based on cooldown period and max errors per cooldown.
 */
function shouldLogError(errorType) {
    const now = Date.now();
    if (!errorCounts[errorType]) {
        errorCounts[errorType] = { timestamp: now, count: 1 };
        return true;
    } else {
        const { timestamp, count } = errorCounts[errorType];
        if (now - timestamp < cooldownPeriod) {
            if (count < maxErrorsPerCooldown) {
                errorCounts[errorType].count++;
                return true;
            } else {
                return false;
            }
        } else {
            errorCounts[errorType] = { timestamp: now, count: 1 };
            return true;
        }
    }
}

/**
 * Handles errors by determining if they should be logged and then logging them.
 */
function handleError(errorType, error, additionalInfo = {}) {
    if (shouldLogError(errorType)) {
        logError(errorType, error, additionalInfo);
    }
}

export default {
    sendDailyErrorSummaryReport,
    errorHandler: async (client) => {
        process.on("unhandledRejection", async (reason) => {
            handleError("Unhandled Rejection", reason);
        });

        process.on("uncaughtException", async (error) => {
            handleError("Uncaught Exception", error);
            process.exit(1); // Exit with error code
        });

        client.on('error', async (error) => {
            handleError("Discord.js Error", error);
        });

        process.on("SIGINT", () => {
            process.exit(0);
        });

        process.on("SIGTERM", () => {
            process.exit(0);
        });
    },
};
