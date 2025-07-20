export function normalizeAmountString(amountStr) {
  // Hilangkan spasi dan pastikan hanya angka, titik, atau koma
  amountStr = amountStr.replace(/\s/g, "").trim();

  // Jika format Eropa (misal 13.000,00), ubah jadi 13000
  if (/^\d{1,3}(\.\d{3})+,\d{2}$/.test(amountStr)) {
    return parseInt(amountStr.replace(/\./g, "").replace(/,\d+$/, ""));
  }

  // Jika format Indonesia/umum: 43,500 → 43500
  if (/^\d{1,3}(,\d{3})+$/.test(amountStr)) {
    return parseInt(amountStr.replace(/,/g, ""));
  }

  // Jika hanya angka: 13000
  if (/^\d+$/.test(amountStr)) {
    return parseInt(amountStr);
  }

  // Jika 13000,00 atau 13000.00 → ambil bagian depan
  if (/^\d+[.,]\d{2}$/.test(amountStr)) {
    return parseInt(amountStr.replace(/[.,]\d{2}$/, ""));
  }

  // Default: hilangkan semua titik dan koma, parse langsung
  return parseInt(amountStr.replace(/[.,]/g, ""));
}
