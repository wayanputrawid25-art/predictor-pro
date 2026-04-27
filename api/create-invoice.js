export default async function handler(req, res) {
  try {
    const SECRET = process.env.XENDIT_SECRET;
    const { chatId } = req.query;

    if (!SECRET) {
      return res.status(500).json({ error: "XENDIT_SECRET kosong" });
    }

    const external_id = `trx-${chatId}-${Date.now()}`;

    const r = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Basic " + Buffer.from(SECRET + ":").toString("base64")
      },
      body: JSON.stringify({
        external_id,
        amount: 15000,
        description: "Predictor Pro Elite",
        success_redirect_url: "https://t.me/prediktorpro_bot",
        failure_redirect_url: "https://t.me/prediktorpro_bot"
      })
    });

    const text = await response.text();
console.log("XENDIT RAW:", text);

return res.status(200).send(text);
    let data;
    try { data = JSON.parse(text); }
    catch { return res.status(500).json({ error: "Response bukan JSON", raw: text }); }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
