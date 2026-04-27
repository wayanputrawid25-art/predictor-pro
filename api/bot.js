export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const body = JSON.parse(raw);

  if (body.callback_query) {
    const chatId = body.callback_query.message.chat.id;

    const inv = await fetch(`${BASE_URL}/api/create-invoice?chatId=${chatId}`);
    const data = await inv.json();

    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        chat_id: chatId,
        text:
`💰 Pembayaran QRIS

Silakan bayar di link berikut:
${data.invoice_url}

Setelah bayar → file otomatis dikirim`
      })
    });
  }

  if (body.message?.text === "/start") {
    await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        chat_id: body.message.chat.id,
        text: "💎 Predictor Pro Elite\n\nKlik beli:",
        reply_markup: {
          inline_keyboard: [[
            { text: "💰 BELI SEKARANG", callback_data: "buy" }
          ]]
        }
      })
    });
  }

  res.status(200).end();
}
