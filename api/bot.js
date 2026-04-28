module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    // ======================
    // READ BODY (ANTI ERROR)
    // ======================
    let raw = "";
    await new Promise(resolve => {
      req.on("data", chunk => raw += chunk);
      req.on("end", resolve);
    });

    if (!raw) {
      return res.status(200).end();
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (e) {
      console.log("JSON ERROR:", raw);
      return res.status(200).end();
    }

    // ======================
    // START COMMAND
    // ======================
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

    // ======================
    // BUTTON CLICK
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

      // ======================
      // CREATE PAYMENT
      // ======================
      let data = null;

      try {
        const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
        data = await payRes.json();
      } catch (e) {
        console.log("FETCH ERROR:", e);
      }

      console.log("PAY RESPONSE:", data);

      // ❌ gagal
      if (!data || data.error) {
        await sendMsg(chatId, "❌ Gagal membuat pembayaran, coba lagi");
        return res.status(200).end();
      }

      const url = data?.Data?.Url;

      // ❌ url kosong
      if (!url) {
        await sendMsg(chatId, "❌ Link pembayaran tidak tersedia");
        return res.status(200).end();
      }

      // ======================
      // SUCCESS
      // ======================
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
};

// ======================
// HELPER SEND MESSAGE
// ======================
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
