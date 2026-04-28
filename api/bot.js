module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    // ✅ LANGSUNG AMBIL BODY (VERCEL SUPPORT)
    const body = req.body;

    if (!body) {
      return res.status(200).send("OK");
    }

    // ======================
    // START
    // ======================
    if (body.message && body.message.text === "/start") {
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

      return res.status(200).send("OK");
    }

    // ======================
    // BUTTON
    // ======================
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

      // CALL API PAYMENT
      const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
      const data = await payRes.json();

      console.log("PAY RESPONSE:", data);

      if (!data || data.error) {
        await sendMsg(chatId, "❌ Gagal membuat pembayaran");
        return res.status(200).send("OK");
      }

      const url = data?.Data?.Url;

      if (!url) {
        await sendMsg(chatId, "❌ Link pembayaran tidak tersedia");
        return res.status(200).send("OK");
      }

      await sendMsg(chatId,
`💳 Pembayaran

Klik link:
${url}

Setelah bayar file otomatis dikirim`);

      return res.status(200).send("OK");
    }

    return res.status(200).send("OK");

  } catch (err) {
    console.error("BOT ERROR:", err);
    return res.status(200).send("OK");
  }
};

// ======================
async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup
    })
  });
}
