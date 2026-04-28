const crypto = require("crypto");

module.exports = async function handler(req, res) {
  try {
    const va = process.env.IPAYMU_VA;
    const apiKey = process.env.IPAYMU_API_KEY;

    const { chatId } = req.query;

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
      .update(va + ":" + jsonBody)
      .digest("hex");

    const response = await fetch("https://my.ipaymu.com/api/v2/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        va: va,
        signature: signature
      },
      body: jsonBody
    });

    const result = await response.json();

    console.log("IPAYMU:", result);

    if (!result || result.Status !== 200) {
      return res.status(200).json({ error: "ipaymu gagal", detail: result });
    }

    globalThis.orders = globalThis.orders || {};
    globalThis.orders[ref] = chatId;

    res.status(200).json(result);

  } catch (e) {
    console.error(e);
    res.status(200).json({ error: "server error" });
  }
};
