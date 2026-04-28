export default async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;
    const OCR_KEY = process.env.OCR_API_KEY;
    const BASE_URL = process.env.BASE_URL;

    const { chatId, fileId } = req.query;

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
      body: `url=${fileUrl}`
    });

    const ocrData = await ocrRes.json();
    const text = ocrData?.ParsedResults?.[0]?.ParsedText || "";

    const t = text.toLowerCase();

    const validNominal =
      text.includes("15000") ||
      text.includes("15.000") ||
      text.includes("15,000");

    const validQRIS =
      t.includes("qris") ||
      t.includes("gopay") ||
      t.includes("dana");

    const validStatus =
      t.includes("berhasil") ||
      t.includes("success");

    if (validNominal && validQRIS && validStatus) {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          document: `${BASE_URL}/file/predictor-pro.zip`,
          caption: "✅ Pembayaran valid\nFile dikirim"
        })
      });
    } else {
      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "❌ Bukti tidak valid"
        })
      });
    }

    return res.status(200).end();

  } catch (err) {
    console.error(err);
    return res.status(200).end();
  }
}
