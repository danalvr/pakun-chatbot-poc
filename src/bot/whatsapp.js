import {
  makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
} from "@whiskeysockets/baileys";

import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";

import handleIncomingMessage from "../services/messageHandler.js";

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (connection === "close") {
      const error = lastDisconnect?.error;
      const shouldReconnect =
        !(error instanceof Boom) ||
        error.output?.statusCode !== DisconnectReason.loggedOut;

      console.log("Disconnected:", error);
      if (shouldReconnect) {
        console.log("🔁 Attempting reconnect...");
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("Connected to WhatsApp!");
    }

    if (qr) {
      console.log("QR Code received, scanning...");
      qrcode.generate(qr, { small: true });
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      const msg = messages[0];
      if (!msg.key.fromMe && msg.message) {
        await handleIncomingMessage(sock, msg);
      }
    }
  });
}

connectToWhatsApp();
