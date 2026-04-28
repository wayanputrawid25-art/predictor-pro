export default async function handler(req, res) {
  try {
    let raw = "";
    await new Promise(r => {
      req.on("data", c => raw += c);
      req.on("end", r);
    });

    const body = JSON.parse(raw);

    const orderId = body.order_id;
    const status = body.transaction_status;

    if (status === "settlement" || status === "capture") {
      const chatId = globalThis.orders?.[orderId];

      if (chatId) {
        const TOKEN = process.env.TELEGRAM_TOKEN;
        const BASE_URL = process.env.BASE_URL;

        await fetch(`https://api.telegram.org/bot${TOKEN}/sendDocument`, {
          method:"POST",
          headers:{ "Content-Type":"application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            document: `${BASE_URL}/file/predictor-pro.zip`,
            caption: "✅ Pembayaran sukses"
          })
        });
      }
    }

    res.status(200).end();

  } catch (e) {
    console.error(e);
    res.status(200).end();
  }
}
