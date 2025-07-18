const express = require("express");
const dotenv = require("dotenv");
const startBot = require("../bot/whatsapp");

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

module.exports = app;
