export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ message: "OK" });
  }

  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const CHAT_ID = process.env.CHAT_ID;

  try {
    const data = req.body;

    // cek status pembayaran
    if (data.transaction_status === "settlement") {

      const fileUrl = "https://YOUR-VERCEL-URL.vercel.app/file/predictor-pro.zip";

      // kirim file ke user
      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          document: fileUrl,
          caption: "✅ Pembayaran berhasil!\n\nIni tools kamu.\n\nCara pakai:\n1. Extract file\n2. Buka index.html\n3. Jalankan di browser / Acode"
        })
      });

    }

    res.status(200).json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}