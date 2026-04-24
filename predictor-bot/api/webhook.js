export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  try {
    // 🔥 FIX: parse body manual
    const body = await new Promise((resolve) => {
      let data = "";
      req.on("data", chunk => data += chunk);
      req.on("end", () => resolve(JSON.parse(data)));
    });

    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || "";

      if (text.toLowerCase().includes("bukti")) {

        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: "https://predictor-pro-two.vercel.app/file/predictor-pro.zip",
            caption: "✅ Pembayaran dikonfirmasi!\n\n📦 Tools:\n- Extract file\n- Buka index.html\n- Jalankan di browser / Acode"
          })
        });

      } else {

        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Halo 👋\n\n💰 Pembelian:\n1. Transfer GoPay\n2. Ketik: BUKTI\n\nNanti file dikirim otomatis"
          })
        });

      }
    }

    res.status(200).json({ ok: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
