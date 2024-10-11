import { DiscordAPIError } from 'discord.js';

export default function getRecoverySuggestions(error) {
  if (error instanceof DiscordAPIError) {
    switch (error.code) {
      case 50001:
        return 'Check bot permissions. Ensure the bot has the necessary permissions in the server and channel.';
      case 50013:
        return "Bot is missing permissions. Review and update the bot's role permissions.";
      case 50007:
        return 'Cannot send messages to this user. The user may have DMs disabled or has blocked the bot.';
      case 10003:
        return 'Unknown channel. Verify the channel ID and ensure the bot has access to it.';
      case 10004:
        return 'Unknown guild. Check if the bot is still in the server or if the server ID is correct.';
      case 10008:
        return 'Unknown message. The message may have been deleted or the ID is incorrect.';
      case 30001:
        return 'Maximum number of guilds reached. Consider upgrading the bot or removing it from unused servers.';
      case 50035:
        return 'Invalid form body. Check the request payload for any missing or incorrect parameters.';
      case 10001:
        return 'Unknown account. Verify the account ID and ensure it exists.';
      case 10006:
        return 'Unknown invite. Check if the invite code is correct and still valid.';
      case 50005:
        return 'Cannot edit a message authored by another user. Ensure the bot only tries to edit its own messages.';
      case 50019:
        return 'A message can only be pinned to the channel it was sent in. Verify the channel ID and message ID.';
      case 40001:
        return 'Unauthorized. Ensure the bot token is valid and has not expired.';
      case 40002:
        return 'You need to verify your account in order to perform this action. Check your email for a verification link from Discord.';
      case 10011:
        return 'Unknown role. Ensure the role ID is correct and the role exists in the server.';
      case 10012:
        return 'Unknown token. Verify the token and ensure it is still valid.';
      case 10014:
        return 'Unknown webhook. Check if the webhook URL is correct and active.';
      case 20012:
        return 'You are not authorized to perform this action on this application. Ensure you have the right permissions.';
      case 50008:
        return 'Cannot send messages in a voice channel. Ensure the bot is trying to send messages in a text channel.';
      case 50033:
        return 'Invalid recipients. Verify the recipient IDs and ensure they are correct.';
      case 50036:
        return 'Invalid file uploaded. Check the file format and size.';
      case 60003:
        return 'Two-factor authentication is required. Ensure 2FA is enabled for the account.';
      case 130000:
        return 'API resource is currently overloaded. Try again later or reduce the load.';
      case 160002:
        return "Cannot reply without permission to read message history. Ensure the bot has the 'Read Message History' permission.";
      case 10005:
        return 'Unknown integration. Verify the integration ID and ensure it exists.';
      case 10007:
        return 'Unknown member. Check if the member ID is correct and the member is still in the server.';
      case 10009:
        return 'Unknown permission overwrite. Verify the overwrite ID and ensure it exists.';
      case 10010:
        return 'Unknown provider. Check if the provider ID is correct and the provider is still available.';
      case 10013:
        return 'Unknown user. Verify the user ID and ensure the user exists.';
      case 10015:
        return 'Unknown webhook. Check if the webhook ID is correct and the webhook is still active.';
      case 20001:
        return 'Bots cannot use this endpoint. Ensure the endpoint is intended for bot use.';
      case 20002:
        return 'Only bots can use this endpoint. Ensure the endpoint is intended for bot use.';
      case 20009:
        return "Explicit content cannot be sent to the desired recipient(s). Ensure the content complies with Discord's guidelines.";
      case 20016:
        return 'This action cannot be performed due to slowmode rate limit. Wait for the slowmode period to end before retrying.';
      case 20018:
        return 'Only the owner of this account can perform this action. Ensure the account owner is performing the action.';
      case 20022:
        return 'This message cannot be edited due to announcement rate limits. Wait for the rate limit to reset before retrying.';
      case 20024:
        return 'Under minimum age. Ensure the user meets the minimum age requirement.';
      case 20028:
        return 'The channel you are writing has hit the write rate limit. Wait for the rate limit to reset before retrying.';
      case 20029:
        return 'The write action you are performing on the server has hit the write rate limit. Wait for the rate limit to reset before retrying.';
      default:
        return "Review the Discord API documentation for this error code and ensure your bot is compliant with Discord's terms of service.";
    }
  }
  if (error instanceof Error) {
    if (error.name === 'ReferenceError') {
      return 'Reference error: Ensure that all variables and functions are defined before use.';
    }
    if (error.name === 'TypeError') {
      return 'Type error: Verify the data types of variables and function parameters.';
    }
    if (error.name === 'SyntaxError') {
      return 'Syntax error: Check for syntax errors in your code. Ensure all parentheses, brackets, and braces are properly closed.';
    }
    if (error.name === 'RangeError') {
      return 'Range error: Ensure values are within the permissible range. Check for infinite loops or excessive recursion.';
    }
    if (error.name === 'EvalError') {
      return 'Eval error: Avoid using `eval()` and ensure code being evaluated is correct.';
    }
    if (error.name === 'URIError') {
      return 'URI error: Check the encoding of URIs and ensure they are correctly formatted.';
    }
    if (error.name === 'ValidationError') {
      return 'Validation error: Check the input data for correctness and completeness.';
    }
    if (error.name === 'DatabaseError') {
      return 'Database error: Check your database connection and queries for issues.';
    }
    if (error.name === 'AuthError') {
      return 'Authorization error: Verify user permissions and authentication methods.';
    }
    if (error.name === 'MongoNetworkError') {
      return 'MongoDB network error: Check your MongoDB connection string and network settings.';
    }
  }

  if (
    error.response &&
    error.response.headers &&
    error.response.headers['x-ratelimit-reset']
  ) {
    const retryAfter =
      parseInt(error.response.headers['x-ratelimit-reset'], 10) * 1000;
    return `Rate limit exceeded. Retry after ${retryAfter} milliseconds.`;
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    return 'File too large: Ensure the file size does not exceed the allowed limit.';
  }
  if (error.code === 'LIMIT_FILE_TYPES') {
    return 'Invalid file type: Ensure the file type is allowed.';
  }

  if (error.response && error.response.status) {
    switch (error.response.status) {
      case 400:
        return 'Bad Request: The request was invalid or cannot be served. Check the request parameters and ensure they are correctly formatted.';
      case 401:
        return 'Unauthorized: The request requires authentication. Verify your bot token or user credentials.';
      case 403:
        return 'Forbidden: The server understood the request but refuses to authorize it. Ensure your bot has the necessary permissions for this action.';
      case 404:
        return 'Not Found: The requested resource could not be found. Double-check the URL, resource ID, or endpoint you are trying to access.';
      case 405:
        return 'Method Not Allowed: The method specified in the request is not allowed for the resource. Verify you are using the correct HTTP method (GET, POST, PUT, DELETE, etc.).';
      case 408:
        return 'Request Timeout: The server timed out waiting for the request. Try again and consider increasing your timeout settings if the issue persists.';
      case 413:
        return 'Payload Too Large: The request is larger than the server is willing or able to process. Check the size of your request body or any files you are uploading.';
      case 414:
        return 'URI Too Long: The URI provided was too long for the server to process. Try to reduce the length of your query parameters or use POST instead of GET for complex queries.';
      case 415:
        return 'Unsupported Media Type: The server refuses to accept the request because the payload format is unsupported. Check your Content-Type header and request body format.';
      case 429:
        return 'Too Many Requests: You have sent too many requests in a given amount of time. Implement rate limiting and honor the rate limit headers in the response.';
      case 431:
        return 'Request Header Fields Too Large: The server is unwilling to process the request because its header fields are too large. Try to reduce the size of your request headers.';
      case 500:
        return "Internal Server Error: The server encountered an unexpected condition that prevented it from fulfilling the request. This is a generic error message, usually generated by the server. Check Discord's status page or try again later.";
      case 501:
        return 'Not Implemented: The server does not support the functionality required to fulfill the request. Ensure you are using a supported API endpoint and method.';
      case 502:
        return "Bad Gateway: The server received an invalid response from an upstream server. This could be a temporary issue with Discord's servers. Try again later.";
      case 503:
        return "Service Unavailable: The server is currently unable to handle the request due to temporary overloading or maintenance. Check Discord's status page and try again later.";
      case 504:
        return "Gateway Timeout: The server did not receive a timely response from an upstream server. This could be due to network issues or problems with Discord's servers. Try again later.";
      case 507:
        return "Insufficient Storage: The server is unable to store the representation needed to complete the request. Check if you're trying to upload or store data that exceeds Discord's limits.";
      case 508:
        return "Loop Detected: The server detected an infinite loop while processing the request. Check your bot's logic to ensure it's not caught in a redirect loop or similar issue.";
      default:
        return `Unexpected HTTP status code: ${error.response.status}. Check the Discord API documentation for more information on this status code.`;
    }
  }

  if (typeof error.message === 'string') {
    if (error.message.includes('rate limit')) {
      return "Implement rate limiting in your bot to avoid hitting Discord's rate limits. Consider using a queue system for commands.";
    }
    if (error.message.includes('WebSocket')) {
      return "Check your internet connection and Discord's status. If the issue persists, implement a reconnection strategy.";
    }
    if (error.message.includes('ECONNREFUSED')) {
      return "Connection refused. Check your firewall settings and ensure Discord's servers are accessible.";
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Increase the timeout duration or ensure the server is responding promptly.';
    }
    if (error.message.includes('ENOTFOUND')) {
      return 'DNS lookup failed. Check your internet connection and DNS settings.';
    }
    if (error.message.includes('ECONNRESET')) {
      return 'Connection was reset. This may be due to network issues or server problems. Try reconnecting.';
    }
    if (error.message.includes('EHOSTUNREACH')) {
      return 'Host unreachable. Verify the server address and your network connection.';
    }
    if (error.message.includes('ENETUNREACH')) {
      return 'Network unreachable. Ensure your network is properly configured and connected.';
    }
    if (error.message.includes('EAI_AGAIN')) {
      return 'DNS lookup timeout. Try again later or check your DNS settings.';
    }
    if (error.message.includes('Configuration Error')) {
      return 'Configuration error: Ensure all configuration parameters are set correctly.';
    }
    if (error.message.includes('Deployment Failed')) {
      return 'Deployment error: Check deployment logs and ensure all dependencies are correctly installed.';
    }
  }

  //  fallback message
  return 'An unexpected error occurred. Review your code for potential issues. Consider adding more error handling and logging to identify the root cause.';
}
