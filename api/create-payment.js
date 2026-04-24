import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const { chatId } = req.query;

    const API_KEY = process.env.IPAYMU_API_KEY;
    const VA = process.env.IPAYMU_VA;
    const BASE_URL = process.env.BASE_URL;

    const body = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      returnUrl: "https://t.me/prediktorpro_bot",
      notifyUrl: `${BASE_URL}/api/callback`,
      referenceId: `TRX-${chatId}-${Date.now()}`
    };

    const bodyString = JSON.stringify(body);

    // ✅ SIGNATURE BENAR
    const signature = crypto
      .createHash("sha256")
      .update(API_KEY + bodyString)
      .digest("hex");

    const response = await fetch("https://my.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "va": VA,
        "apikey": API_KEY,
        "signature": signature
      },
      body: bodyString
    });

    const text = await response.text();
    console.log("IPAYMU:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Response bukan JSON", raw: text });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
