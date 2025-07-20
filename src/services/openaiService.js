// openaiService.js
import { OpenAI } from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function askOpenAI(prompt) {
  const response = await openai.chat.completions.create({
    model: "gpt-4.1", // atau gpt-4 jika tersedia
    messages: [
      {
        role: "system",
        content: "Kamu adalah asisten keuangan pribadi bernama Pakun.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}
