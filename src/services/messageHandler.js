import db from "../config/firebase.js";

import { extractTextFromImage } from "./ocrService.js";
import { askGemini } from "./geminiService.js";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

import { normalizeAmountString } from "../utils/index.js";

// Regex simple untuk deteksi niat pengguna
function detectIntent(text) {
  const msg = text.toLowerCase();

  if (
    /(catat|habis|keluar|pengeluaran|beli|bayar).*(\d+)/.test(msg) ||
    /(spend|pengeluaran|habis uang)/.test(msg)
  )
    return "record_transaction";

  if (
    /(terima|dapat|pemasukan|gaji|masuk).*(\d+)/.test(msg) ||
    /(income|pemasukan)/.test(msg)
  )
    return "record_transaction";

  if (msg.includes("boros") || msg.includes("berlebihan"))
    return "check_spending";

  if (msg.includes("tips") || msg.includes("hemat")) return "financial_tips";

  if (msg.includes("pakun")) return "ai_general";

  return "unknown";
}

export default async function handleIncomingMessage(sock, msg) {
  const sender = msg.key.remoteJid;
  const message = msg.message;
  const text =
    message?.conversation || message?.extendedTextMessage?.text || "";

  let response = "";

  // Handle jika pesan berupa gambar
  if (message?.imageMessage) {
    const stream = await downloadMediaMessage(msg, "buffer");
    const ocrText = await extractTextFromImage(stream);

    const lines = ocrText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    let amount = 0;

    // 1. Cari baris yang mengandung "TOTAL"
    const totalLine = lines.find(
      (line) => /total/i.test(line) && /(\d{1,3}[.,]\d{3})/.test(line)
    );

    if (totalLine) {
      const matches = totalLine.match(/(\d{1,3}(?:[.,]\d{3})+)/g);
      if (matches && matches.length > 0) {
        amount = normalizeAmountString(matches[matches.length - 1]);
      }
    }

    // Fallback jika gagal
    if (!amount || amount < 100) {
      const allCandidates = lines.flatMap((line) => {
        const matches = line.match(/(\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?)/g);
        return matches ? matches.map((m) => normalizeAmountString(m)) : [];
      });

      amount = allCandidates.length > 0 ? Math.max(...allCandidates) : 0;
    }

    // Validasi jumlah minimal (contoh: 100)
    if (amount < 1000) {
      await sock.sendMessage(sender, {
        text: "⚠️ Gagal mendeteksi jumlah transaksi dari gambar. \n Pastikan gambar struk jelas dan mengandung angka nominal.",
      });
      return;
    }

    // Cari note
    const noteLine = lines.find((line) =>
      /indomaret|tokopedia|alfamart|merchant|store|kasir|jl\s/i.test(line)
    );
    const note = noteLine || "Transaksi dari gambar";

    await db.collection("transactions").add({
      sender,
      amount,
      type: "expense",
      note,
      timestamp: new Date(),
      source: "image",
    });

    response = `📸 Transaksi dari gambar tercatat!\n🧾 Catatan: ${note}\n💸 Jumlah: Rp${amount.toLocaleString()}`;
    await sock.sendMessage(sender, { text: response });
    return;
  }

  // Lanjut jika bukan gambar
  const intent = detectIntent(text);

  switch (intent) {
    case "record_transaction":
      let amountMatch = text.match(/(\d+)(\s)?(ribu|rb|k|k)?/i);
      let amount = amountMatch ? parseInt(amountMatch[1]) * 1000 : 0;

      const type = /(terima|dapat|pemasukan|gaji|masuk|income)/i.test(text)
        ? "income"
        : "expense";

      let note = text
        .replace(/.*(pengeluaran|pemasukan|habis|terima|dapat|bayar)/i, "")
        .trim();

      await db.collection("transactions").add({
        sender,
        amount,
        type,
        note,
        timestamp: new Date(),
        source: "text",
      });

      response = `✅ ${
        type === "income" ? "Pemasukan" : "Pengeluaran"
      } sebesar Rp${amount.toLocaleString()} dicatat!\n📌 Catatan: ${note}`;
      break;

    case "check_spending":
      response = await askGemini(
        `Apakah pengeluaran saya minggu ini berlebihan?`
      );
      break;

    case "financial_tips":
      response = await askGemini(
        `Berikan tips random singkat hari ini untuk meningkatkan literasi keuangan.`
      );
      break;

    case "ai_general":
      response = await askGemini(text);
      break;

    default:
      response = `Halo! Saya Pakun, asisten keuanganmu. Kamu bisa ketik:\n- "Catat pengeluaran 20 ribu untuk makan"\n- Kirim gambar struk belanja\n- "Pakun, apakah aku boros minggu ini?"\n- "Pakun, berikan tips hemat!"`;
  }

  await sock.sendMessage(sender, { text: response });
}
