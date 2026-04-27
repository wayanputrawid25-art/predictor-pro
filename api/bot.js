const userState = {};

export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const PAYMENT_LINK = process.env.PAYMENT_LINK;
    const BASE_URL = process.env.BASE_URL;
    const OCR_KEY = process.env.OCR_API_KEY;

    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    if (!raw) return res.status(200).end();

    const body = JSON.parse(raw);

    // ======================
    // START
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
    }

    // ======================
    // BUTTON
    // ======================
   if (body.callback_query) {
  const chatId = body.callback_query.message.chat.id;

  // WAJIB: jawab callback
  await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: body.callback_query.id
    })
  });

  userState[chatId] = Date.now();

  await sendMsg(chatId,
`💰 PEMBAYARAN QRIS

Bayar di link:
${PAYMENT_LINK}

📸 Setelah bayar:
kirim screenshot bukti

⏰ berlaku 30 menit`);
}

    // ======================
    // FOTO → OCR
    // ======================
    if (body.message?.photo) {
      const chatId = body.message.chat.id;

      if (!userState[chatId]) {
        return sendMsg(chatId, "❌ Klik beli dulu");
      }

      // cek expired
      if (Date.now() - userState[chatId] > 30 * 60 * 1000) {
        delete userState[chatId];
        return sendMsg(chatId, "⏰ Transaksi expired");
      }

      const fileId = body.message.photo.pop().file_id;

      const fileRes = await fetch(`https://api.telegram.org/bot${TOKEN}/getFile?file_id=${fileId}`);
      const fileData = await fileRes.json();

      const fileUrl = `https://api.telegram.org/file/bot${TOKEN}/${fileData.result.file_path}`;

      // OCR
      const ocrRes = await fetch("https://api.ocr.space/parse/imageurl", {
        method: "POST",
        headers: {
          apikey: OCR_KEY,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: `url=${fileUrl}&language=eng`
      });

      const ocrData = await ocrRes.json();
      const text = ocrData?.ParsedResults?.[0]?.ParsedText || "";

      console.log("OCR:", text);

      // VALIDASI
      const validNominal =
        text.includes("15000") ||
        text.includes("15.000") ||
        text.includes("15,000");

      const validQRIS =
        text.toLowerCase().includes("qris") ||
        text.toLowerCase().includes("gopay");

      if (validNominal && validQRIS) {
        await sendFile(chatId, BASE_URL);
        delete userState[chatId];
      } else {
        await sendMsg(chatId,
`❌ Bukti tidak valid

Pastikan:
✔ nominal 15000
✔ ada QRIS / GoPay`);
      }
    }

    res.status(200).end();

  } catch (err) {
    console.error(err);
    res.status(200).end();
  }
}

// ======================
async function sendMsg(chatId, text, reply_markup=null) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, text, reply_markup })
  });
}

// ======================
async function sendFile(chatId, BASE_URL) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      document: `${BASE_URL}/file/predictor-pro.zip`,
      caption: "✅ Pembayaran valid\nFile dikirim"
    })
  });
}
