export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const data = JSON.parse(raw);

  if (data.status === "berhasil") {

    const ref = data.referenceId;
    const chatId = ref.split("-")[1];

    await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        document: `${process.env.BASE_URL}/file/predictor-pro.zip`,
        caption:
`✅ PEMBAYARAN BERHASIL

📦 Tools Predictor Pro Elite

📌 Cara pakai:
1. Extract file
2. Buka index.html
3. Jalankan di browser / Acode

Terima kasih 🙏`
      })
    });
  }

  res.status(200).json({ ok: true });
}