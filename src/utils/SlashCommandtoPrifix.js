import { Collection } from 'discord.js';
import loadCommands from './getLocalCommands.js';

export async function convertSlashCommandsToPrefix() {
   const prefixCommands = new Collection();
   const slashCommands = await loadCommands();

   slashCommands.forEach((slashCommand) => {
      if (!slashCommand.prefix) return;

      const prefixCommand = {
         ...slashCommand,
         name: slashCommand.data.name,
         description: slashCommand.data.description,
         aliases: slashCommand.data.aliases || [],
         run: async (client, message, args) => {
            // Handle subcommands
            const { subcommand, remainingArgs, error } = handleSubcommands(
               slashCommand,
               args,
               message
            );
            if (error) return;

            const mockOptions = {};
            const options = subcommand
               ? slashCommand.data.options.find(
                    (opt) => opt.name === subcommand
                 )?.options || []
               : slashCommand.data.options || [];

            options.forEach((option, index) => {
               const value = remainingArgs[index];
               mockOptions[option.name] = parseOptionValue(
                  option,
                  value,
                  message
               );
            });

            const mockInteraction = createMockInteraction(
               message,
               subcommand,
               mockOptions
            );

            try {
               await slashCommand.run(client, mockInteraction);
            } catch (error) {
               console.error(
                  `Error executing command ${slashCommand.data.name}:`,
                  error
               );
               await message.reply(
                  'An error occurred while executing the command. Please try again later.'
               );
            }
         },
      };

      prefixCommands.set(prefixCommand.name, prefixCommand);
      prefixCommand.aliases.forEach((alias) =>
         prefixCommands.set(alias, prefixCommand)
      );
   });

   return prefixCommands;
}

function handleSubcommands(slashCommand, args, message) {
   if (!slashCommand.data.options?.some((opt) => opt.type === 1)) {
      return { subcommand: null, remainingArgs: args };
   }

   const subcommandName = args[0]?.toLowerCase();
   const subcommands = slashCommand.data.options.filter(
      (opt) => opt.type === 1
   );

   if (!subcommandName) {
      const subcommandList = subcommands
         .map((sc) => `\`${sc.name}\``)
         .join(', ');
      message.reply(
         `This command requires a subcommand. Available subcommands: ${subcommandList}`
      );
      return { error: true };
   }

   const subcommand = subcommands.find(
      (sc) => sc.name.toLowerCase() === subcommandName
   );

   if (!subcommand) {
      const subcommandList = subcommands
         .map((sc) => `\`${sc.name}\``)
         .join(', ');
      message.reply(
         `Invalid subcommand \`${subcommandName}\`. Available subcommands: ${subcommandList}`
      );
      return { error: true };
   }

   return {
      subcommand: subcommand.name,
      remainingArgs: args.slice(1),
   };
}

function parseOptionValue(option, value, message) {
   switch (option.type) {
      case 3: // STRING
         return parseStringOption(option, value);
      case 4: // INTEGER
         return parseInt(value) || null;
      case 10: // NUMBER
         return parseFloat(value) || null;
      case 5: // BOOLEAN
         return value?.toLowerCase() === 'true';
      case 6: // USER
         return (
            message.mentions.users.first() ||
            message.guild.members.cache.get(value)?.user ||
            null
         );
      case 7: // CHANNEL
         return (
            message.mentions.channels.first() ||
            message.guild.channels.cache.get(value) ||
            null
         );
      case 8: // ROLE
         return (
            message.mentions.roles.first() ||
            message.guild.roles.cache.get(value) ||
            null
         );
      case 9: // MENTIONABLE
         return (
            message.mentions.members.first() ||
            message.mentions.roles.first() ||
            message.mentions.users.first() ||
            message.guild.members.cache.get(value) ||
            message.guild.roles.cache.get(value) ||
            null
         );
      case 11: // ATTACHMENT
         return message.attachments.first() || null;
      default:
         return null;
   }
}

function parseStringOption(option, value) {
   if (option.choices) {
      const validChoice = option.choices.find(
         (choice) =>
            choice.name.toLowerCase() === value?.toLowerCase() ||
            choice.value.toLowerCase() === value?.toLowerCase()
      );
      return validChoice ? validChoice.value : null;
   }
   return value || null;
}

function createMockInteraction(message, subcommand, mockOptions) {
   return {
      reply: async (options) => handleReply(message, options),
      deferReply: async () => message.channel.sendTyping(),
      editReply: async (options) => handleReply(message, options, true),
      followUp: async (options) => handleReply(message, options),
      fetchReply: async () => message,
      guild: message.guild,
      channel: message.channel,
      member: message.member,
      user: message.author,
      options: {
         getSubcommand: () => subcommand,
         getString: (name) => mockOptions[name],
         getInteger: (name) => mockOptions[name],
         getNumber: (name) => mockOptions[name],
         getBoolean: (name) => mockOptions[name],
         getUser: (name) => mockOptions[name],
         getMember: (name) =>
            message.guild.members.cache.get(mockOptions[name]?.id),
         getChannel: (name) => mockOptions[name],
         getRole: (name) => mockOptions[name],
         getMentionable: (name) => mockOptions[name],
         getAttachment: (name) => mockOptions[name],
      },
   };
}

async function handleReply(message, options, isEdit = false) {
   const content = options.content || '';
   const embeds = options.embeds || [];
   const components = options.components || [];

   if (!content && embeds.length === 0 && components.length === 0) return;

   const replyOptions = { content, embeds, components };

   if (options.ephemeral) {
      return message.author.send(replyOptions);
   }

   if (isEdit) {
      if (message.lastBotReply && !message.lastBotReply.deleted) {
         return message.lastBotReply.edit(replyOptions);
      } else {
         return message.channel.send(replyOptions);
      }
   } else {
      const sentMessage = await message.reply(replyOptions);
      message.lastBotReply = sentMessage;
      return sentMessage;
   }
}
