export default async function handler(req, res) {
  const SECRET = process.env.XENDIT_SECRET;
  const { chatId } = req.query;

  const external_id = "trx-" + chatId + "-" + Date.now();

  const response = await fetch("https://api.xendit.co/v2/invoices", {
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

  const data = await response.json();

  res.status(200).json(data);
}
