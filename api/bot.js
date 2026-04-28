export default async function handler(req, res) {
  const TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const body = JSON.parse(raw);

  // START
  if (body.message?.text === "/start") {
    await sendMsg(body.message.chat.id, "Klik beli:", {
      inline_keyboard: [[
        { text: "💰 BELI SEKARANG", callback_data: "buy" }
      ]]
    });
  }

  // BUTTON
  if (body.callback_query) {
    const chatId = body.callback_query.message.chat.id;

    await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: body.callback_query.id
      })
    });

    const resPay = await fetch(`${BASE_URL}/api/create-payment?chatId=${chatId}`);
    const data = await resPay.json();

    const url = data.Data.Url;

    await sendMsg(chatId, `💳 Bayar di sini:\n${url}`);
  }

  res.status(200).end();
}

async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup })
  });
}
