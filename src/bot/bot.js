const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const { sendOTP, generateOTP } = require('../services/mailer');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userState = new Map();

const mainMenu = Markup.keyboard([
    ['🚀 Loyiha yaratish', '🤝 Rezyume'],
    ['❗ Muammo (Anonim)', '⚙️ Loyihalarim'],
    ['📊 Kabinet']
]).resize();

bot.command('myid', (ctx) => {
    ctx.reply(`Sizning Telegram ID: \`${ctx.from.id}\``, { parse_mode: 'Markdown' });
});

bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        
        if (!user) {
            user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        }
        
        if (user.isBanned) return ctx.reply("⛔️ Akkauntingiz bloklangan.");

        // 👑 ADMIN BYPASS: Agar siz kirsangiz, pochtasiz avtomatik tasdiqlanadi
        const adminId = process.env.ADMIN_TELEGRAM_ID ? process.env.ADMIN_TELEGRAM_ID.trim() : "";
        if (telegramId.toString() === adminId && !user.isVerified) {
            user = await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { isVerified: true, email: "admin@adu.uz" } // Admin uchun virtual korporativ pochta
            });
            await ctx.reply("👑 *Admin Rejimi faollashdi:* Siz uchun email tekshiruvi bekor qilindi va to'g'ridan-to'g'ri tizimga kiritildingiz!", { parse_mode: 'Markdown' });
        }

        // Boshqalar uchun pochta tekshiruvi
        if (!user.isVerified) {
            userState.set(telegramId, { step: 'AWAITING_EMAIL' });
            return ctx.reply("🎓 *ADU Startup Hub yopiq platformasiga xush kelibsiz!*\n\nTizimdan foydalanish uchun universitetingiz tomonidan berilgan korporativ pochtangizni (@adu.uz) kiriting.\n\n_Masalan: talaba@adu.uz_", { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
        }

        ctx.reply("🌟 Bosh menyuga xush kelibsiz!", mainMenu);
        userState.delete(telegramId);
    } catch (error) {
        console.error(error);
        ctx.reply("Tizimda xatolik.");
    }
});

bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const state = userState.get(telegramId);

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state && state.step === 'AWAITING_EMAIL') {
            if (!text.toLowerCase().endsWith('@adu.uz') && !text.toLowerCase().endsWith('@gmail.com')) {
                return ctx.reply("❌ Kechirasiz, platformaga faqat Andijon Davlat Universitetining rasmiy (@adu.uz) pochtasi orqali kirish mumkin. Qayta urinib ko'ring:");
            }

            const existingEmail = await prisma.user.findFirst({ where: { email: text.toLowerCase(), isVerified: true } });
            if (existingEmail && existingEmail.telegramId !== BigInt(telegramId)) {
                return ctx.reply("⚠️ Bu pochta manzili allaqachon boshqa akkauntga ulangan!");
            }

            const loadingMsg = await ctx.reply("⏳ Pochtaga kod yuborilmoqda, kuting...");
            const otp = generateOTP();
            const isSent = await sendOTP(text.toLowerCase(), otp);

            if (isSent) {
                await prisma.user.update({
                    where: { telegramId: BigInt(telegramId) },
                    data: { email: text.toLowerCase(), otpCode: otp }
                });
                userState.set(telegramId, { step: 'AWAITING_OTP' });
                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, `✅ Tasdiqlash kodi *${text}* manziliga yuborildi.\n\nIltimos, pochtangizni tekshiring va 4 xonali kodni shu yerga yozing:`, { parse_mode: 'Markdown' });
            } else {
                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "❌ Pochta serveriga ulanishda xatolik.");
            }
        } 
        else if (state && state.step === 'AWAITING_OTP') {
            if (user.otpCode === text) {
                await prisma.user.update({
                    where: { telegramId: BigInt(telegramId) },
                    data: { isVerified: true, otpCode: null } 
                });
                userState.delete(telegramId);
                ctx.reply("🎉 *Tabriklaymiz!* Siz muvaffaqiyatli tasdiqlandingiz va ADU Startup Hub elita klubiga qabul qilindingiz.", { parse_mode: 'Markdown', ...mainMenu });
            } else {
                ctx.reply("❌ Kod noto'g'ri kiritildi. Iltimos qayta urinib ko'ring yoki /start ni bosib pochtani qayta kiriting.");
            }
        }
        else {
            if (!user.isVerified) return ctx.reply("Iltimos, avval pochtangizni tasdiqlang. (/start)");
            ctx.reply("Modulli arxitektura o'rnatilmoqda. Tez orada loyihalar menyusi ham ulanadi!");
        }

    } catch (error) {
        console.error(error);
        ctx.reply("Xatolik yuz berdi.");
    }
});

function startBot() {
    bot.launch().then(() => console.log("🚀 Telegram Bot ishga tushdi (Modul)"));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startBot };
