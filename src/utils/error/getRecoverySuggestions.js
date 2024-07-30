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
         default:
            return "Review the Discord API documentation for this error code and ensure your bot is compliant with Discord's terms of service.";
      }
   }

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
   if (error instanceof ReferenceError) {
      return 'Reference error: Ensure that all variables and functions are defined before use.';
   }

   if (error instanceof TypeError) {
      return 'Type error: Verify the data types of variables and function parameters.';
   }

   if (error instanceof SyntaxError) {
      return 'Syntax error: Check for syntax errors in your code. Ensure all parentheses, brackets, and braces are properly closed.';
   }

   if (error instanceof RangeError) {
      return 'Range error: Ensure values are within the permissible range. Check for infinite loops or excessive recursion.';
   }

   if (error instanceof EvalError) {
      return 'Eval error: Avoid using `eval()` and ensure code being evaluated is correct.';
   }

   if (error instanceof URIError) {
      return 'URI error: Check the encoding of URIs and ensure they are correctly formatted.';
   }

   if (error.message.includes('rate limit')) {
      return "Implement rate limiting in your bot to avoid hitting Discord's rate limits. Handle rate limit headers and retry after the specified delay.";
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

   if (error instanceof ValidationError) {
      return 'Validation error: Check the input data for correctness and completeness.';
   }

   if (error instanceof DatabaseError) {
      return 'Database error: Check your database connection and queries for issues.';
   }

   if (error instanceof AuthError) {
      return 'Authorization error: Verify user permissions and authentication methods.';
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

   if (error.name === 'MongoNetworkError') {
      return 'MongoDB network error: Check your MongoDB connection string and network settings.';
   }
   if (error.response && error.response.status === 403) {
    return "Authorization error: Ensure your credentials and permissions are correct.";
  }
  if (error.message.includes('Configuration Error')) {
    return "Configuration error: Ensure all configuration parameters are set correctly.";
  }
  
  if (error.message.includes('Deployment Failed')) {
    return "Deployment error: Check deployment logs and ensure all dependencies are correctly installed.";
  }
  
  

   return 'Review your code for potential issues. Consider adding more error handling and logging to identify the root cause.';
}
