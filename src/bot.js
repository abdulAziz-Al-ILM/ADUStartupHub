require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { containsProfanity } = require('./utils/profanityFilter');
const { consumeDailyLimit } = require('./utils/dailyLimit');
const { projectRules, requestRules } = require('./handlers/rules');

// --- VEB SERVER (Railway qulamasligi va sayt ishlashi uchun) ---
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('<h1>ADU Startup Hub tizimi faol ishlamoqda!</h1><p>Iltimos, tizimdan foydalanish uchun Telegram botga o\'ting.</p>');
});

app.listen(PORT, () => {
    console.log(`🌐 Veb server ${PORT}-portda ishga tushdi.`);
});

// --- TELEGRAM BOT MANTIQI ---
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const prisma = new PrismaClient();
const userState = new Map();

const mainMenu = Markup.keyboard([
    ['🚀 Loyiha e\'lon qilish', '🤝 Loyihaga qo\'shilish'],
    ['📊 Mening statistikam']
]).resize();

bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || "yashirin_profil";

    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        
        if (!user) {
            user = await prisma.user.create({
                data: { telegramId: BigInt(telegramId), username: username }
            });
        } else if (user.isBanned) {
            return ctx.reply("⛔️ Kechirasiz, sizning akkauntingiz qoida buzarlik uchun umrbod bloklangan.");
        }

        userState.delete(telegramId);
        ctx.reply(`Assalomu alaykum, ADU Startup Hub platformasiga xush kelibsiz!\n\nIltimos, kerakli bo'limni tanlang:`, mainMenu);
    } catch (error) {
        console.error("Start xatosi:", error);
        ctx.reply("Tizimda vaqtinchalik xatolik yuz berdi.");
    }
});

bot.hears('🚀 Loyiha e\'lon qilish', async (ctx) => {
    const telegramId = ctx.from.id;
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    
    if (!limitCheck.allowed) {
        if (limitCheck.reason === "BANNED") return ctx.reply("⛔️ Akkauntingiz bloklangan.");
        if (limitCheck.reason === "LIMIT_REACHED") return ctx.reply("⚠️ Bugungi kunlik limit tugagan (3/3). Ertaga soat 00:00 dan keyin qayta urinib ko'ring.");
        return ctx.reply("Xatolik yuz berdi.");
    }

    userState.set(telegramId, { step: 'AWAITING_PROJECT_TEXT', remaining: limitCheck.remaining });
    ctx.reply(projectRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

bot.hears('🤝 Loyihaga qo\'shilish', async (ctx) => {
    const telegramId = ctx.from.id;
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    
    if (!limitCheck.allowed) {
        if (limitCheck.reason === "BANNED") return ctx.reply("⛔️ Akkauntingiz bloklangan.");
        if (limitCheck.reason === "LIMIT_REACHED") return ctx.reply("⚠️ Bugungi kunlik limit tugagan (3/3). Ertaga soat 00:00 dan keyin qayta urinib ko'ring.");
        return ctx.reply("Xatolik yuz berdi.");
    }

    userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', remaining: limitCheck.remaining });
    ctx.reply(requestRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

bot.hears('📊 Mening statistikam', async (ctx) => {
    const telegramId = ctx.from.id;
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    
    if (user) {
        ctx.reply(`📊 *Shaxsiy Statistika:*\n\n🔄 Kunlik sarf: ${user.dailyActions}/3\n⚠️ Ogohlantirish: ${user.reportCount}/2\n🛡 Holat: ${user.isBanned ? 'Bloklangan ⛔️' : 'Faol ✅'}`, { parse_mode: 'Markdown' });
    }
});

bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return;

    if (containsProfanity(text)) {
        userState.delete(telegramId);
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        const newReportCount = user.reportCount + 1;
        
        if (newReportCount >= 2) {
            await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { reportCount: newReportCount, isBanned: true }
            });
            return ctx.reply("⛔️ Matnda axloqsiz/taqiqlangan so'z aniqlandi! 2 ta ogohlantirish yig'ildi va akkauntingiz umrbod bloklandi.", mainMenu);
        } else {
            await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { reportCount: newReportCount }
            });
            return ctx.reply(`⚠️ Qat'iy Ogohlantirish! Matnda axloqsiz so'z aniqlandi. Ma'lumotingiz o'chirildi.\n\nSizda 1 ta ogohlantirish bor. 2 tasida bloklanasiz! Qolgan kunlik limit: ${state.remaining}`, mainMenu);
        }
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state.step === 'AWAITING_PROJECT_TEXT') {
            await prisma.project.create({
                data: { title: "Yangi Startap", description: text, authorId: user.id }
            });
            ctx.reply("✅ Loyihangiz muvaffaqiyatli qabul qilindi!", mainMenu);
        } 
        else if (state.step === 'AWAITING_REQUEST_TEXT') {
            const firstProject = await prisma.project.findFirst(); 
            if(firstProject) {
                await prisma.request.create({
                    data: { coverLetter: text, projectId: firstProject.id, applicantId: user.id }
                });
                ctx.reply("✅ Arizangiz loyiha asoschisiga maxfiy ko'rinishda yuborildi!", mainMenu);
            } else {
                ctx.reply("Hozircha tizimda ochiq loyihalar yo'q. Arizangiz saqlanmadi.", mainMenu);
            }
        }
        userState.delete(telegramId);
    } catch (error) {
        console.error("Bazaga yozishda xato:", error);
        ctx.reply("Tizimda xatolik yuz berdi.", mainMenu);
    }
});

bot.launch().then(() => console.log("🚀 ADU Startup Hub boti ishga tushdi!"));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
