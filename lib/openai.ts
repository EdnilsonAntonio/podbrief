import OpenAI from "openai";

if (!process.env.OPEN_AI_KEY) {
  throw new Error("OPEN_AI_KEY is not set in environment variables");
}

export const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_KEY,
});

