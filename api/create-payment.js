export default async function handler(req, res) {
  const { chatId } = req.query;

  const API_KEY = process.env.IPAYMU_API_KEY;
  const VA = process.env.IPAYMU_VA;
  const BASE_URL = process.env.BASE_URL;

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

  const data = await response.json();

  res.status(200).json(data);
}