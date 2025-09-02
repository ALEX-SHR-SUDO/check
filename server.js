import express from "express";
import {
  Connection,
  clusterApiUrl,
  Keypair,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

// Загружаем приватный ключ из переменных окружения
const secret = process.env.PRIVATE_KEY;
if (!secret) {
  throw new Error("❌ Не найден PRIVATE_KEY в переменных окружения");
}
const secretKey = Uint8Array.from(JSON.parse(secret));
const payer = Keypair.fromSecretKey(secretKey);

console.log("✅ PRIVATE_KEY загружен");
console.log("payer public key:", payer.publicKey.toBase58());

const app = express();
app.use(express.json());

// Подключение к Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// === Маршрут создания токена ===
app.post("/create-token", async (req, res) => {
  try {
    const { decimals, supply } = req.body;

    // 1. Создаём минт
    const mint = await createMint(
      connection,
      payer,
      payer.publicKey,
      null,
      decimals
    );

    // 2. Создаём или находим Associated Token Account для минта
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );

    // В новых версиях spl-token может быть .address или .publicKey
    const destination = tokenAccount.address || tokenAccount.publicKey;

    console.log("Mint:", mint.toBase58());
    console.log("Destination ATA:", destination.toBase58());
    console.log("Payer:", payer.publicKey.toBase58());

    // 3. Минтим токены
    await mintTo(
      connection,
      payer,
      mint,
      destination,
      payer,
      supply * Math.pow(10, decimals)
    );

    res.json({
      success: true,
      mint: mint.toBase58(),
      destination: destination.toBase58(),
    });
  } catch (err) {
    console.error("Ошибка в /create-token:", err);
    res.status(500).json({ error: err.message });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
