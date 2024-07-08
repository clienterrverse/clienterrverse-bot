export default async (client, errorHandler, member) => {
   const welcomeChannelId = '1208141730810044416';
   const autoRoleId = '1208103840667402260';

   const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
   const autoRole = member.guild.roles.cache.get(autoRoleId);

   if (!welcomeChannel) {
      console.error(`Welcome channel with ID ${welcomeChannelId} not found.`);
      return;
   }

   if (!autoRole) {
      console.error(`Auto role with ID ${autoRoleId} not found.`);
      return;
   }

   try {
      // Send a welcome message
      const welcomeMessage = await welcomeChannel.send(
         `Welcome to Clienterrverse, ${member}!`
      );

      // Add custom emoji reaction
      const emoji = '<:whip:1223554028794024018>'; // Custom emoji format
      await welcomeMessage.react(emoji);

      // Add the auto role to the member
      await member.roles.add(autoRole);
   } catch (error) {
      console.error('An error occurred:', error);
   }
};
