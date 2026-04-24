export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  try {
    if (req.method !== "POST") {
      return res.status(200).json({ ok: true });
    }

    const body = req.body;

    // fallback kalau body kosong
    const data = body && Object.keys(body).length ? body : JSON.parse(req.body || "{}");

    if (!data.message) {
      return res.status(200).json({ ok: true });
    }

    const chatId = data.message.chat.id;
    const text = (data.message.text || "").toLowerCase();

    if (text.includes("bukti")) {

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          document: "https://predictor-pro-two.vercel.app/file/predictor-pro.zip",
          caption: "✅ Pembayaran dikonfirmasi!\n\n📦 Tools:\n1. Extract file\n2. Buka index.html\n3. Jalankan di browser / Acode"
        })
      });

    } else {

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "Halo 👋\n\n💰 Pembelian:\n1. Transfer GoPay\n2. Ketik: BUKTI\n\nFile dikirim otomatis"
        })
      });

    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
