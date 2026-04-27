export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    if (!raw) return res.status(200).json({ ok: true });

    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return res.status(200).json({ ok: true });
    }

    // ======================
    // BUTTON CLICK
    // ======================
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      try {
        const inv = await fetch(`${BASE_URL}/api/create-invoice?chatId=${chatId}`);
        const text = await inv.text();

        console.log("INVOICE RAW:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Response bukan JSON");
        }

        const payUrl = data.invoice_url;

        if (!payUrl) {
          throw new Error("invoice_url tidak ada");
        }

        await sendMsg(chatId,
`💰 Pembayaran QRIS

Klik link di bawah:
${payUrl}

Setelah bayar → file otomatis dikirim`);

      } catch (err) {
        console.error("ERROR CREATE INVOICE:", err.message);

        await sendMsg(chatId,
"❌ Gagal membuat pembayaran\nCoba lagi nanti");
      }

      return res.status(200).json({ ok: true });
    }

    // ======================
    // START
    // ======================
    if (body.message?.text === "/start") {
      const chatId = body.message.chat.id;

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

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error("FATAL:", err.message);
    return res.status(200).json({ ok: true });
  }
}

// helper
async function sendMsg(chatId, text, replyMarkup = null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      chat_id: chatId,
      text,
      reply_markup: replyMarkup
    })
  });
}
