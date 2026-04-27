export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;

    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });
    if (!raw) return res.status(200).end();

    const body = JSON.parse(raw);

    // tombol beli
    if (body.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      const inv = await fetch(`${BASE_URL}/api/create-invoice?chatId=${chatId}`);
      const data = await inv.json();

      if (!data.invoice_url) {
        await sendMsg(chatId, "❌ Gagal membuat invoice. Coba lagi.");
        return res.status(200).end();
      }

      await sendMsg(chatId,
`💰 Pembayaran QRIS

Silakan bayar di:
${data.invoice_url}

Setelah bayar → file otomatis dikirim`);
    }

    // start
    if (body.message?.text === "/start") {
      await sendMsg(body.message.chat.id,
`💎 Predictor Pro Elite

Harga: Rp15.000

Klik beli:`,
      {
        inline_keyboard: [[
          { text: "💰 BELI SEKARANG", callback_data: "buy" }
        ]]
      });
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
