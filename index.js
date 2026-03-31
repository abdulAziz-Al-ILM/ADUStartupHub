require('dotenv').config();
const { startServer } = require('./src/web/server');
const { startBot } = require('./src/bot/bot');

// Railway bergan portni o'qiydi
const PORT = process.env.PORT || 3000;

console.log("Tizim ishga tushmoqda...");

// 1. Veb serverni (Landing Page) ishga tushirish
startServer(PORT);

// 2. Telegram Botni ishga tushirish
startBot();
