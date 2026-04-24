export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  if (!TELEGRAM_TOKEN || !BASE_URL) {
    return res.status(500).json({ error: "ENV belum lengkap" });
  }

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  let body = {};
  try {
    body = JSON.parse(raw);
  } catch {
    return res.status(200).end();
  }

  // ======================
  // HANDLE BUTTON CLICK
  // ======================
  if (body.callback_query) {
    const chatId = body.callback_query.message.chat.id;
    const data = body.callback_query.data;

    if (data === "buy") {
      try {
        const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
        const textRes = await payRes.text();

        console.log("PAY RAW:", textRes);

        let payData;
        try {
          payData = JSON.parse(textRes);
        } catch {
          throw new Error("Response bukan JSON");
        }

        const payUrl = payData?.Data?.Url || payData?.url;

        if (!payUrl) {
          throw new Error("Link pembayaran tidak ditemukan");
        }

        await sendMsg(chatId,
`💰 PEMBAYARAN

Klik link di bawah:

${payUrl}

Setelah bayar → file dikirim otomatis`);
      } catch (err) {
        console.error("ERROR BUY:", err.message);

        await sendMsg(chatId,
`❌ Gagal membuat pembayaran

Kemungkinan:
- API iPaymu belum benar
- BASE_URL salah

Silakan coba lagi`);
      }
    }

    return res.status(200).end();
  }

  // ======================
  // HANDLE MESSAGE
  // ======================
  if (body.message) {
    const chatId = body.message.chat.id;
    const text = body.message.text || "";

    if (text === "/start") {
      await sendMsg(chatId,
`💎 Predictor Pro Elite

Tools analisa otomatis

Harga: Rp15.000

Klik tombol di bawah untuk beli:`,
      {
        inline_keyboard: [[
          { text: "💰 BELI SEKARANG", callback_data: "buy" }
        ]]
      });
    }
  }

  return res.status(200).end();
}

// helper
async function sendMsg(chatId, text, replyMarkup = null) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup
    })
  });
}
