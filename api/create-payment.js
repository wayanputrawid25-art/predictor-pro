const crypto = require("crypto");

export default async function handler(req, res) {
  try {
    const va = process.env.IPAYMU_VA;
    const apiKey = process.env.IPAYMU_API_KEY;

    const { chatId } = req.query;

    if (!va || !apiKey) {
      return res.status(500).json({
        error: "ENV belum lengkap"
      });
    }

    const ref = "TRX-" + Date.now();

    const body = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      returnUrl: "https://t.me/",
      notifyUrl: process.env.BASE_URL + "/api/callback",
      referenceId: ref
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

    console.log("IPAYMU RESPONSE:", result);

    // ❌ gagal
    if (!result || result.Status !== 200) {
      return res.status(200).json({
        error: "ipaymu gagal",
        detail: result
      });
    }

    const url = result?.Data?.Url;

    if (!url) {
      return res.status(200).json({
        error: "URL kosong",
        detail: result
      });
    }

    // simpan mapping
    globalThis.orders = globalThis.orders || {};
    globalThis.orders[ref] = chatId;

    return res.status(200).json(result);

  } catch (err) {
    console.error("CREATE PAYMENT ERROR:", err);
    return res.status(200).json({
      error: "server error"
    });
  }
}
