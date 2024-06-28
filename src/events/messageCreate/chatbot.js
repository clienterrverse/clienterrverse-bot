import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-pro";
const allowedChannelIds = ["1244565914213679124"];

export default async (client, message) => {
  if (message.author.bot) return;
  if (!allowedChannelIds.includes(message.channel.id)) return;

  const channelId = message.channel.id;

  try {
    const messages = await message.channel.messages.fetch({ limit: 4 });
    const sortedMessages = messages.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    const contextMessages = sortedMessages.map((msg, index) => {
      const userRole = msg.member ? msg.member.roles.highest.name : "User";
      const userDisplayName = msg.member ? msg.member.displayName : msg.author.username;
      return `Message ${index + 1}:\nUser ID: ${msg.author.id}\nMessage Content: ${msg.content}\nUser Name: ${userDisplayName}\nRole: ${userRole}`;
    }).join('\n\n');

    const systemPrompt = "You are Clienterrverse, a helpful and respectful Discord bot. Your owner is clienterr and your developer is norysight. Our official website is clienterr.com. Please provide thoughtful and respectful responses, and act like a human assistant.";
    const userMessage = message.content;
    const userRole = message.member ? message.member.roles.highest.name : "User";
    const userDisplayName = message.member ? message.member.displayName : message.author.username;

    const prompt = [
      { text: `System Prompt:\n${systemPrompt}` },
      { text: `Message History:\n${contextMessages}` },
      { text: `New Message:\nUser ID: ${message.author.id}\nMessage Content: ${userMessage}\nUser Name: ${userDisplayName}\nRole: ${userRole}` }
    ];

    const model = await genAI.getGenerativeModel({ model: MODEL_NAME });

    const generationConfig = {
      temperature: 0.8,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
    };

    const result = await model.generateContent({
      contents: [{ role: "user", parts: prompt }],
      generationConfig,
    });

    let reply = result.response.text();


    if (reply.length > 2000) {
      const replyArray = reply.match(/[\s\S]{1,2000}/g);
      for (const msg of replyArray) {
        await message.reply(msg);
      }
    } else {
      await message.reply(reply);
    }
  } catch (error) {
    console.error("Error generating content:", error);
    await message.reply("Sorry, something went wrong while generating a response.");
  }
};
