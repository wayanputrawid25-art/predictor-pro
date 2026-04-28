export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY;

    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    if (!raw) return res.status(200).end();
    const body = JSON.parse(raw);

    // START
    if (body.message?.text === "/start") {
      const chatId = body.message.chat.id;

      await sendMsg(chatId,
`💎 Predictor Pro Elite
Harga: Rp15.000`,
      {
        inline_keyboard: [[
          { text: "💰 BELI SEKARANG", callback_data: "buy" }
        ]]
      });

      return res.status(200).end();
    }

    // BUTTON → BUAT PAYMENT
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id
        })
      });

      const orderId = "ORDER-" + Date.now();

      const payload = {
        transaction_details: {
          order_id: orderId,
          gross_amount: 15000
        }
      };

      const midRes = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Basic " + Buffer.from(SERVER_KEY + ":").toString("base64")
        },
        body: JSON.stringify(payload)
      });

      const data = await midRes.json();

      const snapUrl = data.redirect_url;

      await sendMsg(chatId,
`💰 Pembayaran

Klik link:
${snapUrl}

Setelah bayar → file otomatis dikirim`);

      // simpan mapping order → chatId (simple)
      globalThis.orders = globalThis.orders || {};
      globalThis.orders[orderId] = chatId;

      return res.status(200).end();
    }

    return res.status(200).end();

  } catch (e) {
    console.error(e);
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
