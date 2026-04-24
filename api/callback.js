export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    return res.status(200).end();
  }

  console.log("CALLBACK:", data);

  if (data.status === "berhasil") {
    try {
      const ref = data.referenceId;
      const chatId = ref.split("-")[1];

      await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendDocument`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          document: `${BASE_URL}/file/predictor-pro.zip`,
          caption:
`✅ PEMBAYARAN BERHASIL

📦 Tools kamu sudah dikirim

📌 Cara pakai:
1. Extract file
2. Buka index.html
3. Jalankan di browser`
        })
      });

    } catch (err) {
      console.error("SEND ERROR:", err.message);
    }
  }

  res.status(200).json({ ok: true });
}
