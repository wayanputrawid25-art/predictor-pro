export const config = {
  api: { bodyParser: true },
};

module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    // START
    if (body?.message?.text === "/start") {
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
    }

    // BUTTON
    if (body?.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      // jawab callback
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id
        })
      });

      // ambil payment
      const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
      const data = await payRes.json();

      console.log("PAY:", data);

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
    }

    res.status(200).send("OK");

  } catch (e) {
    console.error(e);
    res.status(200).send("OK");
  }
};

async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup })
  });
}
