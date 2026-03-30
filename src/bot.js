require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { OpenAI } = require('openai');
const { containsProfanity } = require('./utils/profanityFilter');
const { consumeDailyLimit } = require('./utils/dailyLimit');
const { projectRules, requestRules } = require('./handlers/rules');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // AI ulandi

// =========================================================
// 🌐 VEB SAYT (DASHBOARD) - Railway Linki uchun
// =========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        // Bazadan jonli statistikalarni tortib olamiz
        const usersCount = await prisma.user.count();
        const projectsCount = await prisma.project.count();
        const bannedCount = await prisma.user.count({ where: { isBanned: true } });

        // Zamonaviy va rasmiy Dashboard interfeysi
        const html = `
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub - Jonli Statistika</title>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f4f7f6; color: #333; text-align: center; padding: 40px 20px; margin: 0; }
                .container { max-width: 800px; margin: 0 auto; }
                h1 { color: #2c3e50; font-size: 2.5em; margin-bottom: 5px; }
                p.subtitle { color: #7f8c8d; font-size: 1.1em; margin-bottom: 40px; }
                .cards { display: flex; justify-content: center; flex-wrap: wrap; gap: 20px; }
                .card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); flex: 1; min-width: 200px; border-top: 4px solid #3498db; }
                .card.projects { border-top-color: #2ecc71; }
                .card.banned { border-top-color: #e74c3c; }
                h3 { margin: 0 0 10px 0; color: #95a5a6; font-size: 1.2em; font-weight: normal; }
                .number { font-size: 3em; font-weight: bold; color: #2c3e50; margin: 0; }
                .btn { display: inline-block; margin-top: 40px; padding: 12px 30px; background: #3498db; color: white; text-decoration: none; border-radius: 25px; font-weight: bold; transition: background 0.3s; }
                .btn:hover { background: #2980b9; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>ADU Startup Hub</h1>
                <p class="subtitle">Universitet innovatsiyalarini rivojlantirish platformasi</p>
                
                <div class="cards">
                    <div class="card">
                        <h3>Talabalar (A'zolar)</h3>
                        <p class="number">${usersCount}</p>
                    </div>
                    <div class="card projects">
                        <h3>Faol Startaplar</h3>
                        <p class="number">${projectsCount}</p>
                    </div>
                    <div class="card banned">
                        <h3>Bloklanganlar</h3>
                        <p class="number">${bannedCount}</p>
                    </div>
                </div>

                <a href="https://t.me/BU_YERGA_BOT_USERNAME_YOZING" class="btn">Platformaga kirish (Telegram)</a>
            </div>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Baza yangilanmoqda, birozdan so'ng qayta urinib ko'ring...");
    }
});

app.listen(PORT, () => console.log(`🌐 Sayt ${PORT}-portda yondi.`));

// =========================================================
// 🤖 TELEGRAM BOT VA AI MANTIQI
// =========================================================
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
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
            user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: username } });
        } else if (user.isBanned) {
            return ctx.reply("⛔️ Kechirasiz, sizning akkauntingiz bloklangan.");
        }
        userState.delete(telegramId);
        ctx.reply(`Assalomu alaykum, ADU Startup Hub platformasiga xush kelibsiz!`, mainMenu);
    } catch (error) {
        ctx.reply("Baza ulanmoqda, iltimos /start ni qayta bosing.");
    }
});

bot.hears('🚀 Loyiha e\'lon qilish', async (ctx) => {
    const telegramId = ctx.from.id;
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    if (!limitCheck.allowed) return ctx.reply(limitCheck.reason === "LIMIT_REACHED" ? "⚠️ Bugungi limit tugagan." : "⛔️ Ruxsat yo'q.");

    userState.set(telegramId, { step: 'AWAITING_PROJECT_TEXT', remaining: limitCheck.remaining });
    ctx.reply(projectRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

bot.hears('🤝 Loyihaga qo\'shilish', async (ctx) => {
    const telegramId = ctx.from.id;
    const limitCheck = await consumeDailyLimit(BigInt(telegramId));
    if (!limitCheck.allowed) return ctx.reply(limitCheck.reason === "LIMIT_REACHED" ? "⚠️ Bugungi limit tugagan." : "⛔️ Ruxsat yo'q.");

    userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', remaining: limitCheck.remaining });
    ctx.reply(requestRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

bot.hears('📊 Mening statistikam', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (user) ctx.reply(`📊 *Statistika:*\n🔄 Kunlik sarf: ${user.dailyActions}/3\n⚠️ Ogohlantirish: ${user.reportCount}/2`, { parse_mode: 'Markdown' });
});

bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return;

    if (containsProfanity(text)) {
        userState.delete(telegramId);
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        const newReport = user.reportCount + 1;
        
        await prisma.user.update({
            where: { telegramId: BigInt(telegramId) },
            data: { reportCount: newReport, isBanned: newReport >= 2 }
        });
        return ctx.reply(newReport >= 2 ? "⛔️ Ban oldingiz!" : "⚠️ Axloqsiz so'z! 1-ogohlantirish.", mainMenu);
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state.step === 'AWAITING_PROJECT_TEXT') {
            const loadingMsg = await ctx.reply("⏳ G'oyangiz AI tomonidan tahlil qilinmoqda...");
            
            // AI Analiz Qismi
            let aiFeedback = "AI tahlili vaqtinchalik o'chiq.";
            try {
                const aiResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "Sen qattiqqo'l biznes tahlilchisan. Berilgan startap g'oyasining ustunligi va eng katta xavfini qisqa, 2 ta gap bilan o'zbek tilida yoz." },
                        { role: "user", content: text }
                    ],
                    max_tokens: 150
                });
                aiFeedback = aiResponse.choices[0].message.content;
            } catch (err) {
                console.error("AI ulanishda xato (kalitni tekshiring)");
            }

            await prisma.project.create({
                data: { title: "Yangi Startap", description: text, authorId: user.id }
            });

            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, 
                `✅ Loyihangiz qabul qilindi!\n\n🤖 *AI Tahlili:*\n_${aiFeedback}_`, { parse_mode: 'Markdown' });
            ctx.reply("Asosiy menyuga qaytdingiz.", mainMenu);
        } 
        else if (state.step === 'AWAITING_REQUEST_TEXT') {
            const firstProject = await prisma.project.findFirst(); 
            if(firstProject) {
                await prisma.request.create({
                    data: { coverLetter: text, projectId: firstProject.id, applicantId: user.id }
                });
                ctx.reply("✅ Arizangiz loyiha asoschisiga yuborildi!", mainMenu);
            } else {
                ctx.reply("Hozircha tizimda ochiq loyihalar yo'q.", mainMenu);
            }
        }
        userState.delete(telegramId);
    } catch (error) {
        ctx.reply("Xatolik yuz berdi.", mainMenu);
    }
});

bot.launch().then(() => console.log("🚀 Bot ishga tushdi!"));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
