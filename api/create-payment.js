const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    const va = process.env.IPAYMU_VA;
    const apiKey = process.env.IPAYMU_API_KEY;

    const payload = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      description: ["Pembelian"],
      returnUrl: "https://t.me/",
      cancelUrl: "https://t.me/",
      notifyUrl: process.env.BASE_URL + "/api/callback",
      referenceId: "TRX-" + Date.now(),
      buyerName: "User",
      buyerEmail: "test@email.com",
      buyerPhone: "08123456789"
    };

    const body = JSON.stringify(payload);

    const method = "POST";
    const endpoint = "/api/v2/payment";
    const timestamp = Math.floor(Date.now() / 1000).toString();

    const stringToSign = `${method}:${endpoint}:${body}:${timestamp}`;

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(stringToSign)
      .digest("hex");

    const response = await fetch("https://my.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "va": va,
        "signature": signature,
        "timestamp": timestamp
      },
      body: body
    });

    const result = await response.json();

    console.log("IPAYMU:", result);

    return res.status(200).json(result);

  } catch (err) {
    console.error(err);
    return res.status(200).json({ error: "server error" });
  }
};
