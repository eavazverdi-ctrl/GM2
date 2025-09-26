
import { GoogleGenAI, Chat } from "@google/genai";

// Assume process.env.API_KEY is configured in the environment.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export function createChatSession(): Chat {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: 'You are a friendly and helpful AI assistant chatting with a user in a messaging app. Keep your responses concise and conversational, like you\'re texting a friend. Respond in the same language the user uses. If they use Persian, respond in Persian.',
    },
  });
}
