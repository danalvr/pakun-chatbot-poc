// firebase.js
import admin from "firebase-admin";
import { readFile } from "fs/promises"; // Menggunakan fs/promises untuk membaca file JSON

// Membaca file service-account.json
const serviceAccount = JSON.parse(
  await readFile(
    new URL("../../firebase-service-account.json", import.meta.url)
  )
);

// Inisialisasi Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
export default db;
