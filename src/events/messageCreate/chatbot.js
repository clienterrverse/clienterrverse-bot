const allowedChannelIds = ['1244565914213679124'];

export default async (client, message) => {
  if (message.author.bot) return;
  if (!allowedChannelIds.includes(message.channel.id)) return;
};
