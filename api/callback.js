const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    // ======================
    // PARSE BODY AMAN
    // ======================
    const rawBody = typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body);

    let data;
    try {
      data = typeof req.body === "string"
        ? JSON.parse(req.body)
        : req.body;
    } catch (e) {
      console.log("PARSE ERROR:", rawBody);
      return res.status(200).send("OK");
    }

    console.log("CALLBACK MASUK:", data);

    // ======================
    // VALIDASI BASIC
    // ======================
    if (!data || !data.Data) {
      console.log("DATA INVALID");
      return res.status(200).send("OK");
    }

    const ref = data.Data.ReferenceId;
    const status = data.Status;

    // ======================
    // VALIDASI STATUS
    // ======================
    if (status !== 200) {
      console.log("BELUM BAYAR:", status);
      return res.status(200).send("OK");
    }

    // ======================
    // ANTI DOUBLE SEND
    // ======================
    globalThis.sentOrders = globalThis.sentOrders || {};

    if (globalThis.sentOrders[ref]) {
      console.log("SUDAH DIKIRIM:", ref);
      return res.status(200).send("OK");
    }

    // ======================
    // AMBIL CHAT ID
    // ======================
    const chatId = globalThis.orders?.[ref];

    if (!chatId) {
      console.log("CHAT ID TIDAK ADA:", ref);
      return res.status(200).send("OK");
    }

    // ======================
    // KIRIM FILE
    // ======================
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendDocument`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        document: process.env.BASE_URL + "/file/predictor-pro.zip",
        caption: "✅ Pembayaran berhasil\nFile dikirim otomatis"
      })
    });

    console.log("FILE TERKIRIM:", ref);

    // tandai sudah dikirim
    globalThis.sentOrders[ref] = true;

    return res.status(200).send("OK");

  } catch (err) {
    console.error("CALLBACK ERROR:", err);
    return res.status(200).send("OK");
  }
};
