export default async function handler(req, res) {
  try {
    const { chatId } = req.query;

    const API_KEY = process.env.IPAYMU_API_KEY;
    const VA = process.env.IPAYMU_VA;
    const BASE_URL = process.env.BASE_URL;

    if (!API_KEY || !VA || !BASE_URL) {
      return res.status(500).json({ error: "ENV belum lengkap" });
    }

    const referenceId = `TRX-${chatId}-${Date.now()}`;

    const body = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      returnUrl: "https://t.me/prediktorpro_bot",
      notifyUrl: `${BASE_URL}/api/callback`,
      referenceId
    };

    const response = await fetch("https://my.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "va": VA,
        "apikey": API_KEY
      },
      body: JSON.stringify(body)
    });

    const text = await response.text();
    console.log("IPAYMU RAW:", text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      return res.status(500).json({ error: "Response iPaymu invalid" });
    }

    return res.status(200).json(data);

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
