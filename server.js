const express = require("express");
const cors = require("cors");
const { Connection, Keypair, clusterApiUrl } = require("@solana/web3.js");
const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID
} = require("@solana/spl-token");

const app = express();
app.use(cors());
app.use(express.json());

// Проверка PRIVATE_KEY
if (!process.env.PRIVATE_KEY) {
  console.error("❌ Error: PRIVATE_KEY not set in Environment Variables!");
  process.exit(1);
}

let payer;
try {
  const secretKey = Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY));
  payer = Keypair.fromSecretKey(secretKey);
  console.log("✅ PRIVATE_KEY loaded successfully!");
} catch (err) {
  console.error("❌ Error parsing PRIVATE_KEY:", err.message);
  process.exit(1);
}

// Подключение к Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Простейший маршрут проверки
app.get("/", (req, res) => {
  res.send("✅ Solana Token API is running!");
});

// Эндпоинт создания токена
app.post("/create-token", async (req, res) => {
  try {
    const { decimals = 9, supply = 1000 } = req.body;

    // Создаём новый mint
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      decimals,
      TOKEN_PROGRAM_ID
    );

    // Создаём аккаунт владельца
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    // Выпускаем токены
    await mintTo(
      connection,
      payer,
      mint,
      tokenAccount.address,
      payer,
      supply
    );

    // Возвращаем результат
    res.json({
      success: true,
      mintAddress: mint.toBase58(),
      ownerAccount: tokenAccount.address.toBase58()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
