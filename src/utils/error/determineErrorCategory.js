import { DiscordAPIError } from 'discord.js';

export default function determineErrorCategory(error) {
  if (error instanceof DiscordAPIError) {
    switch (error.code) {
      case 10001:
        return 'Unknown Account';
      case 10002:
        return 'Unknown Application';
      case 10003:
        return 'Unknown Channel';
      case 10004:
        return 'Unknown Guild';
      case 10005:
        return 'Unknown Integration';
      case 10006:
        return 'Unknown Invite';
      case 10007:
        return 'Unknown Member';
      case 10008:
        return 'Unknown Message';
      case 10009:
        return 'Unknown Permission Overwrite';
      case 10010:
        return 'Unknown Provider';
      case 10011:
        return 'Unknown Role';
      case 10012:
        return 'Unknown Token';
      case 10013:
        return 'Unknown User';
      case 10014:
        return 'Unknown Emoji';
      case 10015:
        return 'Unknown Webhook';
      case 10026:
        return 'Unknown Ban';
      case 10027:
        return 'Unknown SKU';
      case 10028:
        return 'Unknown Store Listing';
      case 10029:
        return 'Unknown Entitlement';
      case 10030:
        return 'Unknown Build';
      case 10031:
        return 'Unknown Lobby';
      case 10032:
        return 'Unknown Branch';
      case 10033:
        return 'Unknown Redistributable';
      case 10036:
        return 'Unknown Guild Template';
      case 10057:
        return 'Unknown Guild Preview';
      case 10059:
        return 'Unknown Ban Fetch';
      case 10060:
        return 'Unknown SKU Fetch';
      case 10062:
        return 'Unknown Store Listing Fetch';
      case 10063:
        return 'Unknown Entitlement Fetch';
      case 10066:
        return 'Unknown Build Fetch';
      case 10067:
        return 'Unknown Lobby Fetch';
      case 10068:
        return 'Unknown Branch Fetch';
      case 10069:
        return 'Unknown Redistributable Fetch';
      case 20001:
        return 'Bots cannot use this endpoint';
      case 20002:
        return 'Only bots can use this endpoint';
      case 20009:
        return 'Explicit Content Cannot Be Sent to the Desired Recipient(s)';
      case 20012:
        return 'You are not authorized to perform this action on this application';
      case 20016:
        return 'This action cannot be performed due to slowmode rate limit';
      case 20018:
        return 'Only the owner of this account can perform this action';
      case 20022:
        return 'This message cannot be edited due to announcement rate limits';
      case 20024:
        return 'Under minimum age';
      case 20028:
        return 'The channel you are writing has hit the write rate limit';
      case 20029:
        return 'The write action you are performing on the server has hit the write rate limit';
      case 30001:
        return 'Maximum number of guilds reached (100)';
      case 30002:
        return 'Maximum number of friends reached (1000)';
      case 30003:
        return 'Maximum number of pins reached for the channel (50)';
      case 30005:
        return 'Maximum number of guild roles reached (250)';
      case 30007:
        return 'Maximum number of webhooks reached (10)';
      case 30010:
        return 'Maximum number of reactions reached (20)';
      case 30013:
        return 'Maximum number of guild channels reached (500)';
      case 30015:
        return 'Maximum number of attachments in a message reached (10)';
      case 30016:
        return 'Maximum number of invites reached (1000)';
      case 30018:
        return 'Maximum number of animated emojis reached';
      case 30019:
        return 'Maximum number of server members reached';
      case 40001:
        return 'Unauthorized';
      case 40002:
        return 'You need to verify your account in order to perform this action';
      case 40003:
        return 'You are opening direct messages too fast';
      case 40005:
        return 'Request entity too large';
      case 40006:
        return 'This feature has been temporarily disabled server-side';
      case 40007:
        return 'The user is banned from this guild';
      case 40033:
        return 'This message has already been crossposted';
      case 50001:
        return 'Missing Access';
      case 50002:
        return 'Invalid Account Type';
      case 50003:
        return 'Cannot execute action on a DM channel';
      case 50004:
        return 'Guild Widget Disabled';
      case 50005:
        return 'Cannot edit a message authored by another user';
      case 50006:
        return 'Cannot send an empty message';
      case 50007:
        return 'Cannot send messages to this user';
      case 50008:
        return 'Cannot send messages in a voice channel';
      case 50009:
        return 'Channel verification level is too high for you to gain access';
      case 50010:
        return 'OAuth2 application does not have a bot';
      case 50011:
        return 'OAuth2 application limit reached';
      case 50012:
        return 'Invalid OAuth2 State';
      case 50013:
        return 'You lack permissions to perform that action';
      case 50014:
        return 'Invalid authentication token provided';
      case 50015:
        return 'Note was too long';
      case 50016:
        return 'Provided too few or too many messages to delete. Must provide at least 2 and fewer than 100 messages to delete';
      case 50019:
        return 'A message can only be pinned to the channel it was sent in';
      case 50020:
        return 'Invite code was either invalid or taken';
      case 50021:
        return 'Cannot execute action on a system message';
      case 50024:
        return 'Cannot execute action on this channel type';
      case 50025:
        return 'Invalid OAuth2 access token provided';
      case 50026:
        return 'Missing required OAuth2 scope';
      case 50027:
        return 'Invalid Webhook Token Provided';
      case 50028:
        return 'Invalid role';
      case 50033:
        return 'Invalid Recipient(s)';
      case 50034:
        return 'A message provided was too old to bulk delete';
      case 50035:
        return 'Invalid form body (returned for both application/json and multipart/form-data bodies), or invalid Content-Type provided';
      case 50036:
        return "An invite was accepted to a guild the application's bot is not in";
      case 50041:
        return 'Invalid API version provided';
      case 50045:
        return 'File uploaded exceeds the maximum size';
      case 50046:
        return 'Invalid file uploaded';
      case 50054:
        return 'Cannot self-redeem this gift';
      case 50070:
        return 'Payment source required to redeem gift';
      case 50074:
        return 'Cannot delete a channel required for Community guilds';
      case 50080:
        return 'Cannot edit stickers within a message';
      case 50081:
        return 'Invalid sticker sent';
      case 50083:
        return 'Tried to perform an operation on an archived thread, such as editing a message or adding a user to the thread';
      case 50084:
        return 'Invalid thread notification settings';
      case 50085:
        return 'before value is earlier than the thread creation date';
      case 50095:
        return 'This server is not available in your location';
      case 50097:
        return 'This server needs monetization enabled in order to perform this action';
      case 60003:
        return 'Two factor is required for this operation';
      case 80004:
        return 'No users with DiscordTag exist';
      case 90001:
        return 'Reaction was blocked';
      case 110001:
        return 'Application command with that name already exists';
      case 130000:
        return 'API resource is currently overloaded. Try again a little later';
      case 150006:
        return 'The Stage is already open';
      case 160002:
        return 'Cannot reply without permission to read message history';
      case 160004:
        return 'A thread has already been created for this message';
      case 160005:
        return 'Thread is locked';
      case 160006:
        return 'Maximum number of active threads reached';
      case 160007:
        return 'Maximum number of active announcement threads reached';
      case 170001:
        return 'Invalid JSON for uploaded Lottie file';
      case 170002:
        return 'Uploaded Lotties cannot contain rasterized images such as PNG or JPEG';
      case 170003:
        return 'Sticker maximum framerate exceeded';
      case 170004:
        return 'Sticker frame count exceeds maximum of 1000 frames';
      case 170005:
        return 'Lottie animation maximum dimensions exceeded';
      case 170006:
        return 'Sticker frame rate is either too small or too large';
      case 170007:
        return 'Sticker animation duration exceeds maximum of 5 seconds';
      default:
        return 'Unknown Discord API Error';
    }
  }
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
    return 'Disk Error';
  if (message.includes('timeout')) return 'Timeout Error';
  if (message.includes('format')) return 'Format Error';
  if (message.includes('range')) return 'Range Error';
  return 'Unknown Error';
}
