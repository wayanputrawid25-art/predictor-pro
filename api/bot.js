const userState = {};

export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;
    const PAYMENT = process.env.PAYMENT_INFO;

    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    if (!raw) return res.status(200).end();
    const body = JSON.parse(raw);

    // ===== START
    if (body.message?.text === "/start") {
      const chatId = body.message.chat.id;

      await sendMsg(chatId,
`💎 Predictor Pro Elite

Harga: Rp15.000

💳 Pembayaran:
${PAYMENT}

Klik beli:`,
      {
        inline_keyboard: [[
          { text: "💰 BELI SEKARANG", callback_data: "buy" }
        ]]
      });

      return res.status(200).end();
    }

    // ===== BUTTON
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      // WAJIB jawab callback
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id
        })
      });

      userState[chatId] = Date.now();

      await sendMsg(chatId,
`💰 PEMBAYARAN

Transfer ke:
${PAYMENT}

📸 Kirim screenshot bukti

⏰ berlaku 30 menit`);

      return res.status(200).end();
    }

    // ===== FOTO → KIRIM KE OCR (ANTI TIMEOUT)
    if (body.message?.photo) {
      const chatId = body.message.chat.id;

      if (!userState[chatId]) {
        return sendMsg(chatId, "❌ Klik beli dulu");
      }

      if (Date.now() - userState[chatId] > 30 * 60 * 1000) {
        return sendMsg(chatId, "⏰ Transaksi expired");
      }

      const fileId = body.message.photo.pop().file_id;

      // kirim ke OCR (async)
      fetch(`${BASE_URL}/api/ocr?chatId=${chatId}&fileId=${fileId}`);

      await sendMsg(chatId, "⏳ Sedang cek bukti...");

      return res.status(200).end();
    }

    return res.status(200).end();

  } catch (err) {
    console.error(err);
    return res.status(200).end();
  }
}

async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup })
  });
}
