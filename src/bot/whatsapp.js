const {
  default: makeWASocket,
  useMultiFileAuthState,
} = require("@whiskeysockets/baileys");

const { Crypto } = require("@peculiar/webcrypto");
global.crypto = new Crypto();

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth"); // 'auth' is the folder to save credentials
  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true, // Display QR code in the terminal
  });

  sock.ev.on("creds.update", saveCreds); // Save credentials on update

  // Handle connection events (optional)
  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      // Reconnect if connection closed unexpectedly
      // Example: if (lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut) { connectToWhatsApp(); }
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }
  });

  // Handle incoming messages
  sock.ev.on("messages.upsert", async (m) => {
    console.log(JSON.stringify(m, undefined, 2));
    // Process incoming messages here
    // Example: if (m.messages[0].message.conversation === 'hello') {
    //     await sock.sendMessage(m.messages[0].key.remoteJid, { text: 'world!' });
    // }
  });
}

module.exports = connectToWhatsApp;
