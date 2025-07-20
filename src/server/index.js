// server.js
import express from "express";
import dotenv from "dotenv";
import startBot from "../bot/whatsapp.js"; // pastikan file ini juga pakai export default

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Pakun WhatsApp Bot is running!");
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  await startBot();
});

export default app;
