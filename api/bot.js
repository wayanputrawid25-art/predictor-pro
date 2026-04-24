export default async function handler(req, res) {
  try {
    const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    if (!TELEGRAM_TOKEN || !BASE_URL) {
      console.error("ENV KOSONG");
      return res.status(200).json({ ok: true });
    }

    let raw = "";

    await new Promise((resolve) => {
      req.on("data", chunk => raw += chunk);
      req.on("end", resolve);
    });

    if (!raw) {
      return res.status(200).json({ ok: true });
    }

    let body;
    try {
      body = JSON.parse(raw);
    } catch (err) {
      console.error("JSON ERROR:", err.message);
      return res.status(200).json({ ok: true });
    }

    // ======================
    // HANDLE BUTTON
    // ======================
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      try {
        const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
        const text = await payRes.text();

        console.log("PAY:", text);

        let payData;
        try {
          payData = JSON.parse(text);
        } catch {
          throw new Error("Payment bukan JSON");
        }

        const payUrl = payData?.Data?.Url || payData?.url;

        if (!payUrl) throw new Error("URL kosong");

        await sendMsg(chatId,
`💰 PEMBAYARAN

Klik link berikut:
${payUrl}`);

      } catch (err) {
        console.error("ERROR BUY:", err.message);

        await sendMsg(chatId,
"❌ Gagal membuat pembayaran\nCoba lagi nanti");
      }

      return res.status(200).json({ ok: true });
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

Harga: Rp15.000

Klik tombol untuk beli:`,
        {
          inline_keyboard: [[
            { text: "💰 BELI SEKARANG", callback_data: "buy" }
          ]]
        });
      }
    }

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("FATAL ERROR:", err.message);
    return res.status(200).json({ ok: true }); // jangan 500 lagi!
  }
}

// helper
async function sendMsg(chatId, text, replyMarkup = null) {
  try {
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
  } catch (err) {
    console.error("SEND ERROR:", err.message);
  }
}
