const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    const va = process.env.IPAYMU_VA;
    const apiKey = process.env.IPAYMU_API_KEY;

    const payload = {
      product: ["Predictor Pro Elite"],
      qty: ["1"],
      price: ["15000"],
      returnUrl: "https://t.me/",
      notifyUrl: process.env.BASE_URL + "/api/callback"
    };

    const body = JSON.stringify(payload);

    const signature = crypto
      .createHmac("sha256", apiKey)
      .update(body)
      .digest("hex");

    const response = await fetch("https://my.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "va": va,
        "signature": signature
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
