export default async function handler(req, res) {
  try {
    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    const data = JSON.parse(raw);

    if (data.Status === 200) {
      const ref = data.Data.ReferenceId;
      const chatId = globalThis.orders?.[ref];

      if (chatId) {
        await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_TOKEN}/sendDocument`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: process.env.BASE_URL + "/file/predictor-pro.zip",
            caption: "✅ Pembayaran berhasil"
          })
        });
      }
    }

    res.status(200).end();

  } catch (err) {
    console.error(err);
    res.status(200).end();
  }
}
