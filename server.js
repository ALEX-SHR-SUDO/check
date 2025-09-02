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

// 🔹 Загрузка PRIVATE_KEY
if (!process.env.PRIVATE_KEY) {
  console.error("❌ PRIVATE_KEY не задан в Environment Variables!");
  process.exit(1);
}

let payer;
try {
  // Преобразуем строку JSON в массив чисел
  const secretKey = JSON.parse(process.env.PRIVATE_KEY);
  if (!Array.isArray(secretKey)) throw new Error("PRIVATE_KEY должен быть массивом чисел!");
  payer = Keypair.fromSecretKey(Uint8Array.from(secretKey));
  console.log("✅ PRIVATE_KEY загружен");
  console.log("payer public key:", payer.publicKey.toBase58());
} catch (err) {
  console.error("❌ Ошибка при разборе PRIVATE_KEY:", err.message);
  process.exit(1);
}

// 🔹 Подключение к Devnet
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// 🔹 Тестовый маршрут
app.get("/", (req, res) => {
  res.send("✅ Solana Token API is running!");
});

// 🔹 Эндпоинт для создания токена
app.post("/create-token", async (req, res) => {
  try {
    const { decimals = 9, supply = 1000 } = req.body;
    console.log("Запрос /create-token:", { decimals, supply });

    // 1️⃣ Создаём новый mint
    const mint = await createMint(
      connection,
      payer,            // signer
      payer.publicKey,  // mint authority
      null,             // freeze authority
      decimals,
      TOKEN_PROGRAM_ID
    );
    console.log("Mint создан:", mint.toBase58());

    // 2️⃣ Создаём или получаем токен-аккаунт владельца
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      mint,
      payer.publicKey
    );
    console.log("Token account:", tokenAccount.address.toBase58());

    // 3️⃣ Выпускаем токены
    const txSig = await mintTo(
      connection,
      payer,                  // signer
      mint,                   // mint
      tokenAccount.address,   // destination
      payer,                  // authority
      supply                  // количество
    );
    console.log("Токены выпущены, tx:", txSig);

    // 4️⃣ Отправляем результат на фронтенд
    res.json({
      success: true,
      mintAddress: mint.toBase58(),
      ownerAccount: tokenAccount.address.toBase58(),
      txSignature: txSig
    });

  } catch (err) {
    console.error("❌ Ошибка в /create-token:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 🔹 Запуск сервера
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
