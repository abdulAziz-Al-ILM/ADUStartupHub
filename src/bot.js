require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const { containsProfanity } = require('./utils/profanityFilter');
const { consumeDailyLimit } = require('./utils/dailyLimit');
const { projectRules, requestRules } = require('./handlers/rules');

// Kutubxonalarni ishga tushirish
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const prisma = new PrismaClient();

// Foydalanuvchi qaysi bosqichda ekanligini bilish uchun vaqtinchalik xotira
const userState = new Map();

// Asosiy menyu klaviaturasi
const mainMenu = Markup.keyboard([
    ['🚀 Loyiha e\'lon qilish', '🤝 Loyihaga qo\'shilish'],
    ['📊 Mening statistikam']
]).resize();

// --- BOSH MURVAT (/start) ---
bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const username = ctx.from.username || "yashirin_profil";

    try {
        // Bazadan izlaymiz yoki yangi ro'yxatdan o'tkazamiz
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        
        if (!user) {
            user = await prisma.user.create({
                data: { telegramId: BigInt(telegramId), username: username }
            });
        } else if (user.isBanned) {
            return ctx.reply("⛔️ Kechirasiz, sizning akkauntingiz qoida buzarlik uchun umrbod bloklangan.");
        }

        userState.delete(telegramId); // Holatni tozalaymiz
        ctx.reply(`Assalomu alaykum, ADU Startup Hub platformasiga xush kelibsiz!\n\nIltimos, kerakli bo'limni tanlang:`, mainMenu);
    } catch (error) {
        console.error("Start xatosi:", error);
        ctx.reply("Tizimda vaqtinchalik xatolik yuz berdi.");
    }
});

// --- LOYIHA E'LON QILISH ---
bot.hears('🚀 Loyiha e\'lon qilish', async (ctx) => {
    const telegramId = ctx.from.id;
    
    // Qat'iy limitni tekshirish va yechish
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    if (!limitCheck.allowed) {
        if (limitCheck.reason === "BANNED") return ctx.reply("⛔️ Akkauntingiz bloklangan.");
        if (limitCheck.reason === "LIMIT_REACHED") return ctx.reply("⚠️ Bugungi kunlik limit tugagan (3/3). Ertaga soat 00:00 dan keyin qayta urinib ko'ring.");
        return ctx.reply("Xatolik yuz berdi.");
    }

    // Foydalanuvchini "Loyiha yozish" rejimiga o'tkazamiz
    userState.set(telegramId, { step: 'AWAITING_PROJECT_TEXT', remaining: limitCheck.remaining });
    
    // Kontekstual qoidani ko'rsatamiz
    ctx.reply(projectRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

// --- LOYIHAGA QO'SHILISH ---
bot.hears('🤝 Loyihaga qo\'shilish', async (ctx) => {
    const telegramId = ctx.from.id;
    
    // Limitni yechamiz
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    if (!limitCheck.allowed) {
        if (limitCheck.reason === "BANNED") return ctx.reply("⛔️ Akkauntingiz bloklangan.");
        if (limitCheck.reason === "LIMIT_REACHED") return ctx.reply("⚠️ Bugungi kunlik limit tugagan (3/3). Ertaga soat 00:00 dan keyin qayta urinib ko'ring.");
        return ctx.reply("Xatolik yuz berdi.");
    }

    // MVP uchun hozircha ochiq loyihalarni ro'yxat qilmaymiz, to'g'ridan to'g'ri ariza qabul qilamiz
    userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', remaining: limitCheck.remaining });
    
    ctx.reply(requestRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

// --- STATISTIKA ---
bot.hears('📊 Mening statistikam', async (ctx) => {
    const telegramId = ctx.from.id;
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
    
    if (user) {
        ctx.reply(`📊 *Shaxsiy Statistika:*\n\n🔄 Kunlik sarf: ${user.dailyActions}/3\n⚠️ Ogohlantirish (Report): ${user.reportCount}/2\n🛡 Holat: ${user.isBanned ? 'Bloklangan ⛔️' : 'Faol ✅'}`, { parse_mode: 'Markdown' });
    }
});

// --- MATNLARNI QABUL QILISH VA FILTRLASH ---
bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return; // Agar foydalanuvchi oddiy menyuda bo'lsa, javob bermaymiz

    // 1. Matnni axloqsizlikka tekshirish (Eng muhim filtr)
    if (containsProfanity(text)) {
        userState.delete(telegramId); // Rejimdan chiqaramiz
        
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        const newReportCount = user.reportCount + 1;
        
        if (newReportCount >= 2) {
            // "O'lim jazosi"
            await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { reportCount: newReportCount, isBanned: true }
            });
            return ctx.reply("⛔️ Matnda axloqsiz/taqiqlangan so'z aniqlandi! 2 ta ogohlantirish yig'ildi va akkauntingiz umrbod bloklandi.", mainMenu);
        } else {
            // 1-ogohlantirish
            await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { reportCount: newReportCount }
            });
            return ctx.reply(`⚠️ Qat'iy Ogohlantirish! Matnda axloqsiz so'z aniqlandi. Yuborgan ma'lumotingiz o'chirildi.\n\nSizda 1 ta ogohlantirish bor. 2 tasida umrbod bloklanasiz! Qolgan kunlik limit: ${state.remaining}`, mainMenu);
        }
    }

    // 2. Filtrdan toza o'tsa, bazaga yozish
    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state.step === 'AWAITING_PROJECT_TEXT') {
            await prisma.project.create({
                data: {
                    title: "Yangi Startap", // Buni keyingi bosqichlarda nomini ham so'raydigan qilsa bo'ladi
                    description: text,
                    authorId: user.id
                }
            });
            ctx.reply("✅ Loyihangiz muvaffaqiyatli qabul qilindi! Baza xavfsiz saqladi.", mainMenu);
        } 
        else if (state.step === 'AWAITING_REQUEST_TEXT') {
            // Hozircha statik ravishda birinchi loyihaga (ID: 1) ulash mantiqi. 
            // Keyinchalik qaysi loyihaga ekanligini tugmalar orqali aniqlaymiz.
            const firstProject = await prisma.project.findFirst(); 
            
            if(firstProject) {
                await prisma.request.create({
                    data: {
                        coverLetter: text,
                        projectId: firstProject.id,
                        applicantId: user.id
                    }
                });
                ctx.reply("✅ Arizangiz loyiha asoschisiga maxfiy ko'rinishda yuborildi!", mainMenu);
            } else {
                ctx.reply("Hozircha tizimda ochiq loyihalar yo'q. Arizangiz saqlanmadi, limit yechilgani bo'yicha qoldi.", mainMenu);
            }
        }
        
        userState.delete(telegramId); // Jarayon tugadi, rejimni tozalaymiz
    } catch (error) {
        console.error("Bazaga yozishda xato:", error);
        ctx.reply("Tizimda xatolik yuz berdi.", mainMenu);
    }
});

bot.launch().then(() => console.log("🚀 ADU Startup Hub boti ishga tushdi!"));

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
