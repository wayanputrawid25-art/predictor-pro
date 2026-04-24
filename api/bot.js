let users = {};

export default async function handler(req, res) {
  const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
  const BASE_URL = process.env.BASE_URL;

  let raw = "";
  await new Promise(r => {
    req.on("data", c => raw += c);
    req.on("end", r);
  });

  const body = JSON.parse(raw);
  if (!body.message) return res.status(200).end();

  const chatId = body.message.chat.id;
  const text = body.message.text || "";

  // START
  if (text === "/start") {

    await sendMsg(chatId, "💎 Predictor Pro Elite\n\nKlik tombol untuk beli:", {
      inline_keyboard: [[
        { text: "💰 BELI SEKARANG", callback_data: "buy" }
      ]]
    });
  }

  res.status(200).end();
}

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