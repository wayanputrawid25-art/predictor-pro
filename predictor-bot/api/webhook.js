export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  if (req.method === "POST") {
    const body = req.body;

    if (body.message) {
      const chatId = body.message.chat.id;
      const text = body.message.text || "";

      // kalau user kirim bukti / keyword
      if (text.toLowerCase().includes("bukti")) {

        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: "https://predictor-pro-two.vercel.app/file/predictor-pro.zip",
            caption: "✅ Pembayaran dikonfirmasi\n\nIni tools kamu.\n\nCara pakai:\n1. Extract file\n2. Buka index.html\n3. Jalankan di browser / Acode"
          })
        });

      } else {
        // pesan awal
        await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "Halo 👋\n\nUntuk pembelian:\n1. Transfer ke GoPay\n2. Kirim bukti dengan ketik: BUKTI"
          })
        });
      }
    }
  }

  res.status(200).json({ ok: true });
}
