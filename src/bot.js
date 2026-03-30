require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { OpenAI } = require('openai');
const { containsProfanity } = require('./utils/profanityFilter');
const { consumeDailyLimit } = require('./utils/dailyLimit');
const { projectRules, requestRules } = require('./handlers/rules');

const prisma = new PrismaClient();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); 

// =========================================================
// 🌐 ZAMONAVIY VEB SAYT (DASHBOARD) 
// =========================================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', async (req, res) => {
    try {
        const usersCount = await prisma.user.count();
        const projectsCount = await prisma.project.count();
        const bannedCount = await prisma.user.count({ where: { isBanned: true } });

        // Zamonaviy Tailwind CSS va chiroyli dizaynlashtirilgan HTML
        const html = `
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | Rasmiy Panel</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
                body { font-family: 'Inter', sans-serif; background: linear-gradient(135deg, #f0f4f8 0%, #e2e8f0 100%); min-height: 100vh; }
                .glass-card { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05); }
            </style>
        </head>
        <body class="flex flex-col items-center justify-center p-6 text-slate-800">
            
            <div class="max-w-4xl w-full">
                <div class="text-center mb-12">
                    <h1 class="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                        <span class="text-blue-600">ADU</span> Startup Hub
                    </h1>
                    <p class="text-lg text-slate-600">Universitet innovatsiyalarini va iqtidorlarni rivojlantirish markazi</p>
                    <div class="inline-block mt-4 px-4 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-semibold shadow-sm">
                        <i class="fas fa-check-circle mr-1"></i> Tizim faol ishlamoqda
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <div class="glass-card rounded-2xl p-6 text-center border-t-4 border-t-blue-500 hover:-translate-y-1 transition transform duration-300">
                        <div class="w-12 h-12 mx-auto bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-4 text-xl"><i class="fas fa-users"></i></div>
                        <h3 class="text-slate-500 font-semibold mb-1">Jami Talabalar</h3>
                        <p class="text-4xl font-black text-slate-800">${usersCount}</p>
                    </div>
                    
                    <div class="glass-card rounded-2xl p-6 text-center border-t-4 border-t-emerald-500 hover:-translate-y-1 transition transform duration-300">
                        <div class="w-12 h-12 mx-auto bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 text-xl"><i class="fas fa-rocket"></i></div>
                        <h3 class="text-slate-500 font-semibold mb-1">Faol Startaplar</h3>
                        <p class="text-4xl font-black text-slate-800">${projectsCount}</p>
                    </div>

                    <div class="glass-card rounded-2xl p-6 text-center border-t-4 border-t-rose-500 hover:-translate-y-1 transition transform duration-300">
                        <div class="w-12 h-12 mx-auto bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-4 text-xl"><i class="fas fa-ban"></i></div>
                        <h3 class="text-slate-500 font-semibold mb-1">Bloklanganlar</h3>
                        <p class="text-4xl font-black text-slate-800">${bannedCount}</p>
                    </div>
                </div>

                <div class="text-center">
                    <a href="https://t.me/ADUStartupHubBot" target="_blank" class="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600">
                        <i class="fab fa-telegram-plane mr-2 text-xl"></i> Platformaga kirish
                    </a>
                    <p class="mt-4 text-sm text-slate-500">Barcha jarayonlar Telegram ilovasi orqali xavfsiz amalga oshiriladi.</p>
                </div>
            </div>

        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Baza sinxronizatsiya qilinmoqda, birozdan so'ng sahifani yangilang...");
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
    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        if (!user) {
            user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        } else if (user.isBanned) {
            return ctx.reply("⛔️ Kechirasiz, sizning akkauntingiz bloklangan.");
        }
        userState.delete(telegramId);
        ctx.reply(`Assalomu alaykum, ADU Startup Hub platformasiga xush kelibsiz!`, mainMenu);
    } catch (error) {
        console.error(error);
        ctx.reply("Ma'lumotlar bazasi bilan aloqa o'rnatilmoqda. Iltimos, /start ni qayta bosing.");
    }
});

bot.hears('🚀 Loyiha e\'lon qilish', async (ctx) => {
    const limitCheck = await consumeDailyLimit(BigInt(ctx.from.id));
    if (!limitCheck.allowed) return ctx.reply(limitCheck.reason === "LIMIT_REACHED" ? "⚠️ Bugungi limit tugagan." : "⛔️ Ruxsat yo'q.");
    userState.set(ctx.from.id, { step: 'AWAITING_PROJECT_TEXT', remaining: limitCheck.remaining });
    ctx.reply(projectRules + `\n\nSizda bugun yana ${limitCheck.remaining} ta urinish qoldi.`, Markup.removeKeyboard());
});

bot.hears('🤝 Loyihaga qo\'shilish', async (ctx) => {
    const limitCheck = await consumeDailyLimit(BigInt(ctx.from.id));
    if (!limitCheck.allowed) return ctx.reply(limitCheck.reason === "LIMIT_REACHED" ? "⚠️ Bugungi limit tugagan." : "⛔️ Ruxsat yo'q.");
    userState.set(ctx.from.id, { step: 'AWAITING_REQUEST_TEXT', remaining: limitCheck.remaining });
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
        await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { reportCount: newReport, isBanned: newReport >= 2 } });
        return ctx.reply(newReport >= 2 ? "⛔️ Ban oldingiz!" : "⚠️ Axloqsiz so'z! 1-ogohlantirish.", mainMenu);
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state.step === 'AWAITING_PROJECT_TEXT') {
            const loadingMsg = await ctx.reply("⏳ G'oyangiz AI tomonidan tahlil qilinmoqda...");
            let aiFeedback = "AI tahlili amalga oshmadi.";
            
            try {
                const aiResponse = await openai.chat.completions.create({
                    model: "gpt-3.5-turbo",
                    messages: [
                        { role: "system", content: "Sen qattiqqo'l biznes tahlilchisan. Berilgan startap g'oyasining eng kuchli tomoni va eng katta xavfini qisqa, 2 ta gap bilan o'zbek tilida yoz." },
                        { role: "user", content: text }
                    ],
                    max_tokens: 150
                });
                aiFeedback = aiResponse.choices[0].message.content;
            } catch (err) {
                console.error("AI xatosi:", err);
            }

            await prisma.project.create({ data: { title: "Yangi Startap", description: text, authorId: user.id } });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, `✅ Loyihangiz qabul qilindi!\n\n🤖 *AI Tahlili:*\n_${aiFeedback}_`, { parse_mode: 'Markdown' });
            ctx.reply("Asosiy menyuga qaytdingiz.", mainMenu);
        } 
        else if (state.step === 'AWAITING_REQUEST_TEXT') {
            const firstProject = await prisma.project.findFirst(); 
            if(firstProject) {
                await prisma.request.create({ data: { coverLetter: text, projectId: firstProject.id, applicantId: user.id } });
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

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
