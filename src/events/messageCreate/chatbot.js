import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.geminiapi);
const MODEL_NAME = "gemini-pro";
const customPromptChannelId = "1255557421569675416"; 
// Create a cache object
const messageCache = {};

export default async (client, message) => {
  // Check if the message is from a bot or not
  if (message.author.bot) return;

  // Check if the message is from the specified channel or the custom prompt channel
  const allowedChannelIds = ["1255557421569675416", customPromptChannelId];
  if (!allowedChannelIds.includes(message.channel.id)) return;

  try {
    const channelId = message.channel.id;
    let contextMessages;

    // Check if recent messages are cached
    if (messageCache[channelId]) {
      contextMessages = messageCache[channelId];
    } else {
      // Fetch the last 10 messages from the channel for context
      const fetchedMessages = await message.channel.messages.fetch({ limit: 10 });

      // Collect the contents of the last 10 messages to provide context
      contextMessages = fetchedMessages
        .filter(msg => !msg.author.bot || msg.author.id === client.user.id) // Remove other bot messages
        .map(msg => {
          const role = msg.member ? msg.member.roles.highest.name : 'Member';
          return `${msg.author.username} (${role}): ${msg.content}`;
        })
        .reverse();

      // Cache the messages
      messageCache[channelId] = contextMessages;
    }

    const context = contextMessages.join('\n');

    // Prepare the input for the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const generationConfig = {
      temperature: 0.9,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const userMessage = message.content; // Current message content
    const userRole = message.member ? message.member.roles.highest.name : 'Member';
    const parts = [
      {
        text: `You are Clienterrverse, a Discord bot. The owner is clienterr and the developer is norysight. Our official website is clienterr.com \nHere is the recent conversation context:\n${context}\n\n message author: ${message.author.username} role(${userRole}) sends a message: ${userMessage}`,
      },
    ];

    // Generate a response using the generative model
    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts,
      }],
      generationConfig,
    });

    let reply = await result.response.text();

    // Due to Discord limitations, split the message if it's too long
    if (reply.length > 2000) {
      const replyArray = reply.match(/[\s\S]{1,2000}/g);
      for (const msg of replyArray) {
        await message.reply(msg);
      }
      return;
    }

    message.reply(reply);
  } catch (error) {
    console.error("Error generating content:", error);
    // Handle error gracefully
    message.reply("Sorry, something went wrong while generating a response.");
  }
};
