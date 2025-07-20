import axios from "axios";

const API_KEY = process.env.GEMINI_API_KEY;
const URL = process.env.GEMINI_API_URL;
const GEMINI_API_URL = `${URL}=${API_KEY}`;

export async function askGemini(prompt) {
  try {
    const response = await axios.post(
      GEMINI_API_URL,
      {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const result = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    return result || "Tidak ada respons dari Gemini.";
  } catch (error) {
    console.error("Error dari Gemini:", error.response?.data || error.message);
    return "Terjadi kesalahan saat memanggil Gemini API.";
  }
}
