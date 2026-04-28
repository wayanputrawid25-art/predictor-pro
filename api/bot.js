module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    let raw = "";
    await new Promise(resolve => {
      req.on("data", chunk => raw += chunk);
      req.on("end", resolve);
    });

    // ✅ kalau kosong → skip
    if (!raw) return res.status(200).end();

    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      console.log("JSON ERROR:", raw);
      return res.status(200).end();
    }

    // ===== START
    if (body.message?.text === "/start") {
      const chatId = body.message.chat.id;

      await sendMsg(chatId,
`💎 Predictor Pro Elite

Harga: Rp15.000

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

      // jawab callback WAJIB
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id
        })
      });

      // request ke create payment
      const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
      const data = await payRes.json();

      console.log("PAY RESPONSE:", data);

      // ❌ kalau error
      if (!data || data.error) {
        return sendMsg(chatId, "❌ Gagal membuat pembayaran");
      }

      const url = data?.Data?.Url;

      if (!url) {
        return sendMsg(chatId, "❌ Link pembayaran tidak tersedia");
      }

      await sendMsg(chatId,
`💳 Pembayaran

Klik link:
${url}

Setelah bayar file otomatis dikirim`);

      return res.status(200).end();
    }

    return res.status(200).end();

  } catch (err) {
    console.error("BOT ERROR:", err);
    return res.status(200).end();
  }
}

// helper
async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  try {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup
      })
    });
  } catch (e) {
    console.error("SEND MSG ERROR:", e);
  }
}
