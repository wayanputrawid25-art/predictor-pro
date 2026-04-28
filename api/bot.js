module.exports = async function handler(req, res) {
  try {
    const TOKEN = process.env.TELEGRAM_TOKEN;

    const body = req.body;

    console.log("INCOMING:", body);

    if (body?.message?.text === "/start") {
      const chatId = body.message.chat.id;

      await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ BOT AKTIF"
        })
      });
    }

    res.status(200).send("OK");

  } catch (e) {
    console.error("ERROR:", e);
    res.status(200).send("OK");
  }
};
