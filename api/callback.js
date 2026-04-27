export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const data = JSON.parse(raw);

  if (data.status === "PAID") {
    const chatId = data.external_id.split("-")[1];

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        document: `${BASE_URL}/file/predictor-pro.zip`,
        caption: "✅ Pembayaran berhasil\n\nFile dikirim otomatis"
      })
    });
  }

  res.status(200).end();
}
