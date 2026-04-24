export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const body = JSON.parse(raw);

  // ======================
  // HANDLE BUTTON CLICK
  // ======================
  if (body.callback_query) {

    const chatId = body.callback_query.message.chat.id;
    const data = body.callback_query.data;

    if (data === "buy") {

      // buat link bayar
      const payRes = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
      const payData = await payRes.json();

      const payUrl = payData?.Data?.Url || payData?.url;

      await sendMsg(chatId,
`💰 PEMBAYARAN

Klik link di bawah untuk bayar:

${payUrl}

Setelah bayar → file dikirim otomatis`);

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

Tools analisa angka otomatis

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
