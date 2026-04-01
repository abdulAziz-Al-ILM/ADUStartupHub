const { startServer } = require('./src/web/server');
const { startBot } = require('./src/bot/bot');

// Railway bergan port yoki 8080
const PORT = process.env.PORT || 8080;

console.log("🚀 Tizim ishga tushmoqda...");

try {
    // 1. Veb-serverni ishga tushirish
    startServer(PORT);
    
    // 2. Botni ishga tushirish (Faqat token bo'lsa ishlaydi, aks holda serverni qulatmaydi)
    if (process.env.TELEGRAM_BOT_TOKEN) {
        startBot();
    } else {
        console.log("⚠️ TELEGRAM_BOT_TOKEN topilmadi. Telegram bot o'chirib qo'yildi, faqat Veb-sayt ishlamoqda.");
    }

    // 3. Kutilmagan xatolar serverni qulatmasligi uchun global himoya
    process.on('uncaughtException', (err) => {
        console.error("Kritik xatolik (Kechirilgan):", err);
    });
    process.on('unhandledRejection', (err) => {
        console.error("Kutilmagan xatolik (Kechirilgan):", err);
    });

} catch (error) {
    console.error("Tizimni ishga tushirishda xatolik:", error);
}
