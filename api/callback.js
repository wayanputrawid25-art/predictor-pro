module.exports = async function handler(req, res) {
  try {
    const data = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    console.log("CALLBACK:", data);

    if (data.Status === 200) {
      const ref = data.Data?.ReferenceId;
      const chatId = globalThis.orders?.[ref];

      if (chatId) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendDocument`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: process.env.BASE_URL + "/file/predictor-pro.zip",
            caption: "✅ Pembayaran berhasil\nFile dikirim"
          })
        });
      }
    }

    res.status(200).send("OK");

  } catch (e) {
    console.error(e);
    res.status(200).send("OK");
  }
};
