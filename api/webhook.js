export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    let rawData = "";

    await new Promise((resolve) => {
      req.on("data", chunk => rawData += chunk);
      req.on("end", resolve);
    });

    const body = JSON.parse(rawData);

    if (!body.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = body.message.chat.id;

    // =========================
    // 📸 JIKA USER KIRIM FOTO
    // =========================
    if (body.message.photo) {

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          document: "https://predictor-pro-two.vercel.app/file/predictor-pro.zip",
          caption:
`✅ PEMBAYARAN DITERIMA

📦 Tools Predictor Pro Elite:
Silakan download file di atas

━━━━━━━━━━━━━━━━━━━
📌 Cara Pakai:

1. Extract file .zip
2. Buka file index.html
3. Jalankan di browser / Acode

━━━━━━━━━━━━━━━━━━━
💡 Tips:
Gunakan data 7–14 hari agar hasil lebih optimal

Terima kasih 🙏`
        })
      });

    } else {

      // =========================
      // 💬 PESAN AWAL / SALAH FORMAT
      // =========================
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text:
`💎 PREDICTOR PRO ELITE

Tools analisa angka berbasis:
✔ Hot & Cool
✔ BBFS otomatis
✔ Sistem Kembar
✔ Output 2D 32 Line

━━━━━━━━━━━━━━━━━━━
💰 PEMBELIAN

Harga: Rp15.000

GoPay: 08123834801
a.n: I Wayan Putra Widnyana

━━━━━━━━━━━━━━━━━━━
📌 WAJIB:
✔ Transfer + kode unik
✔ Contoh: 15.137

━━━━━━━━━━━━━━━━━━━
🧾 SETELAH BAYAR:
1. Screenshot bukti (FULL)
2. Kirim ke sini (WAJIB FOTO)

━━━━━━━━━━━━━━━━━━━
⚠️ TANPA FOTO → TIDAK DIPROSES`
        })
      });

    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
