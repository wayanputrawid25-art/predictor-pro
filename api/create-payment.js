import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const va = process.env.IPAYMU_VA;
    const apiKey = process.env.IPAYMU_API_KEY;

    const { chatId } = req.query;

    const body = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      returnUrl: "https://t.me/yourbot",
      notifyUrl: process.env.BASE_URL + "/api/callback",
      referenceId: "TRX-" + Date.now()
    };

    const jsonBody = JSON.stringify(body);

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(jsonBody)
      .digest("hex");

    const response = await fetch("https://sandbox.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        va: va,
        signature: signature
      },
      body: jsonBody
    });

    const result = await response.json();

    // simpan mapping
    globalThis.orders = globalThis.orders || {};
    globalThis.orders[result.Data.ReferenceId] = chatId;

    res.status(200).json(result);

  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
}
