module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const BASE_URL = process.env.BASE_URL;
    const OCR_KEY = process.env.OCR_API_KEY;

    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    // ======================
    // START
    // ======================
    if (body?.message?.text === "/start") {
      const chatId = body.message.chat.id;

      await sendMsg(chatId,
`💎 Predictor Pro Elite

Harga: Rp15.000

Klik beli:` ,
      {
        inline_keyboard: [[
          { text: "💰 BELI SEKARANG", callback_data: "buy" }
        ]]
      });
    }

    // ======================
    // KLIK BELI
    // ======================
    if (body?.callback_query) {
      const chatId = body.callback_query.message.chat.id;

      globalThis.userState = globalThis.userState || {};
      globalThis.userState[chatId] = Date.now();

      // jawab tombol
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          callback_query_id: body.callback_query.id
        })
      });

      await sendPhoto(chatId, `${BASE_URL}/file/qris.jpg`,
`💳 Pembayaran QRIS

Silakan scan QR di atas
Nominal: Rp15.000

📸 Setelah bayar kirim screenshot

⏰ Berlaku 30 menit`);
    }

    // ======================
    // TERIMA FOTO
    // ======================
    if (body?.message?.photo) {
      const chatId = body.message.chat.id;

      if (!globalThis.userState?.[chatId]) {
        return sendMsg(chatId, "❌ Klik beli dulu");
      }

      const fileId = body.message.photo.pop().file_id;

      // ambil file
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
        text.toLowerCase().includes("gopay") ||
        text.toLowerCase().includes("dana");

      if (validNominal && validQRIS) {
        await sendFile(chatId, BASE_URL);
        delete globalThis.userState[chatId];
      } else {
        await sendMsg(chatId,
`❌ Bukti tidak valid

Pastikan:
✔ nominal 15000
✔ ada QRIS / GoPay / DANA`);
      }
    }

    res.status(200).send("OK");

  } catch (err) {
    console.error(err);
    res.status(200).send("OK");
  }
};

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
async function sendPhoto(chatId, photo, caption) {
  const TOKEN = process.env.TELEGRAM_TOKEN;

  await fetch(`https://api.telegram.org/bot${TOKEN}/sendPhoto`, {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ chat_id: chatId, photo, caption })
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
