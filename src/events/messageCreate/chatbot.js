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
          return `${msg.author.username}: ${msg.content}`;
        })
        .reverse();

      // Cache the messages
      messageCache[channelId] = contextMessages;
    }

    const context = contextMessages.join('\n');

    // Prepare the input for the generative model
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const generationConfig = {
      temperature: 0.7, // Adjusting temperature for more coherent responses
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 150, // Adjusted to ensure the response is concise
    };

    const userMessage = message.content; // Current message content
    const parts = [
      {
        text: `Hello! I'm Clienterrverse, here to chat with you. Based on our conversation and recent messages:\n${context}\n\nYou said: ${userMessage}`,
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
