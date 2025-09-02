import express from "express";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

// ✅ Главная проверка
app.get("/", (req, res) => {
  res.send("✅ Server is running on Render!");
});

// ✅ Эндпоинт для токена (пример)
app.post("/create-token", async (req, res) => {
  try {
    const { decimals, supply } = req.body;
    console.log("Запрос /create-token:", { decimals, supply });

    // Здесь будет логика Solana
    // Временно вернем тестовый ответ
    res.json({
      success: true,
      decimals,
      supply,
      message: "Токен создан (заглушка)"
    });
  } catch (err) {
    console.error("Ошибка /create-token:", err);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Render требует слушать process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
