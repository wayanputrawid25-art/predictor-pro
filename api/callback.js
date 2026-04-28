export default async function handler(req, res) {
  try {
    let raw = "";
    await new Promise(resolve => {
      req.on("data", chunk => raw += chunk);
      req.on("end", resolve);
    });

    if (!raw) return res.status(200).end();

    const data = JSON.parse(raw);

    console.log("CALLBACK:", data);

    // hanya kalau sukses
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

    return res.status(200).end();

  } catch (err) {
    console.error("CALLBACK ERROR:", err);
    return res.status(200).end();
  }
}
