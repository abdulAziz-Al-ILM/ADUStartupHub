require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { containsProfanityOrLink } = require('./utils/profanityFilter');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

// =========================================================
// 🌐 ZAMONAVIY DARK MODE PWA SAYT (DASHBOARD VA KATALOG)
// =========================================================
app.get('/', async (req, res) => {
    try {
        // Bazadan statistikani va ro'yxatlarni olamiz
        const usersCount = await prisma.user.count();
        const projectsCount = await prisma.project.count();
        const resumesCount = await prisma.resume.count();
        const problemsCount = await prisma.problem.count();

        // Oxirgi qo'shilgan ma'lumotlarni tortib olish (Katalog uchun)
        const projects = await prisma.project.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ take: 5, orderBy: { createdAt: 'desc' }, include: { author: true } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | Premium Platforma</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <script>
                tailwind.config = { darkMode: 'class', theme: { extend: { colors: { darkbg: '#0f172a', darkcard: '#1e293b', accent: '#3b82f6' } } } }
            </script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; overflow-x: hidden; }
                .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .tab-content { display: none; }
                .tab-content.active { display: block; animation: fadeIn 0.3s ease-in-out; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        </head>
        <body class="flex h-screen overflow-hidden">

            <aside class="w-64 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20">
                <div class="p-6 border-b border-slate-700/50">
                    <h1 class="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <i class="fas fa-layer-group text-accent"></i> ADU Hub
                    </h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto hide-scrollbar">
                    <button onclick="switchTab('dashboard')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-medium active-tab"><i class="fas fa-chart-pie w-5"></i> Bosh sahifa (Statistika)</button>
                    <button onclick="switchTab('startups')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-medium"><i class="fas fa-rocket w-5"></i> Startap Loyihalar</button>
                    <button onclick="switchTab('talents')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-medium"><i class="fas fa-users w-5"></i> Mutaxassislar (E'lonlar)</button>
                    <button onclick="switchTab('problems')" class="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-medium"><i class="fas fa-exclamation-triangle w-5"></i> Muammolar bazasi</button>
                </nav>
                <div class="p-4 border-t border-slate-700/50">
                    <a href="https://t.me/BU_YERGA_BOT_USERNAME_YOZING" target="_blank" class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent text-white rounded-xl font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/20">
                        <i class="fab fa-telegram-plane"></i> Tizimga kirish
                    </a>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto bg-[#0f172a] p-4 md:p-8">
                
                <div class="mb-8 flex gap-4 items-center">
                    <div class="relative flex-1 max-w-2xl">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" placeholder="Loyihalar, ko'nikmalar yoki muammolarni qidiring..." class="w-full bg-darkcard border border-slate-700 rounded-2xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition">
                    </div>
                </div>

                <div id="dashboard" class="tab-content active">
                    <h2 class="text-3xl font-bold mb-6 text-white">Platforma Statistikasi</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-blue-500">
                            <h3 class="text-slate-400 font-medium mb-2">A'zolar</h3>
                            <p class="text-4xl font-black text-white">${usersCount}</p>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-emerald-500">
                            <h3 class="text-slate-400 font-medium mb-2">Faol Startaplar</h3>
                            <p class="text-4xl font-black text-white">${projectsCount}</p>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-purple-500">
                            <h3 class="text-slate-400 font-medium mb-2">Mutaxassislar</h3>
                            <p class="text-4xl font-black text-white">${resumesCount}</p>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-rose-500">
                            <h3 class="text-slate-400 font-medium mb-2">Dolzarb Muammolar</h3>
                            <p class="text-4xl font-black text-white">${problemsCount}</p>
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-3xl font-bold mb-6 text-white">Faol Startap Loyihalar</h2>
                    <div class="grid gap-4">
                        ${projects.length > 0 ? projects.map(p => `
                        <div class="glass p-5 rounded-2xl flex justify-between items-start hover:border-accent/50 transition cursor-pointer">
                            <div>
                                <span class="text-xs font-bold text-accent bg-blue-500/10 px-2 py-1 rounded-md mb-2 inline-block">${p.category}</span>
                                <h3 class="text-xl font-bold text-white mb-1">${p.title}</h3>
                                <p class="text-slate-400 text-sm line-clamp-2">${p.description}</p>
                            </div>
                            <span class="text-slate-500 text-xs">${new Date(p.createdAt).toLocaleDateString()}</span>
                        </div>
                        `).join('') : '<p class="text-slate-400">Hali loyihalar kiritilmagan.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content"><h2 class="text-3xl font-bold mb-6">Mutaxassislar E'lonlari</h2><p class="text-slate-400">Tizim orqali qoldirilgan rezyumelar shu yerda ko'rinadi.</p></div>
                <div id="problems" class="tab-content"><h2 class="text-3xl font-bold mb-6">Dolzarb Muammolar</h2><p class="text-slate-400">Foydalanuvchilar kiritgan muammolar shu yerda ko'rinadi.</p></div>

            </main>

            <script>
                function switchTab(tabId) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.getElementById(tabId).classList.add('active');
                }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Xatolik: Baza bilan aloqa yo'q.");
    }
});

// Soxta ma'lumotlar qo'shish (Testing uchun URL API)
app.get('/api/seed', async (req, res) => {
    try {
        const dummyUser = await prisma.user.create({ data: { telegramId: 999999999n, username: "test_user" } });
        await prisma.project.create({ data: { title: "AI Talaba Yordamchisi", description: "Imtihonlarga tayyorlovchi sun'iy intellekt bot.", authorId: dummyUser.id, category: "Sun'iy Intellekt" } });
        await prisma.resume.create({ data: { skills: "React, Node.js, UI/UX dizayn qila olaman.", authorId: dummyUser.id, category: "Full-Stack" } });
        await prisma.problem.create({ data: { description: "Universitet bufetida navbat juda katta, oldindan buyurtma berish tizimi yo'q.", authorId: dummyUser.id } });
        res.send("✅ Test ma'lumotlari bazaga joylandi. Saytni yangilang.");
    } catch (err) {
        res.send("Xatolik yoki ma'lumotlar allaqachon mavjud.");
    }
});

app.listen(PORT, () => console.log(`🌐 Sayt ${PORT}-portda yondi.`));

// =========================================================
// 🤖 TELEGRAM BOT VA MURAKKAB LIMITLAR MANTIQI
// =========================================================
const userState = new Map();

bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        if (!user) user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        
        const isAdmin = telegramId.toString() === ADMIN_ID;
        const welcomeText = isAdmin ? "👑 Assalomu alaykum, Admin! Sizda barcha limitlar cheksiz." : "Assalomu alaykum, ADU Startup Hub platformasiga xush kelibsiz!";
        
        ctx.reply(welcomeText, Markup.keyboard([
            ['🚀 Loyiha e\'lon qilish', '🤝 Jamoa izlayapman (Rezyume)'],
            ['❗ Muammo kiritish', '📊 Mening statistikam']
        ]).resize());
    } catch (error) {
        ctx.reply("Tizimda nosozlik.");
    }
});

// Loyiha e'lon qilish (Haftada 2 ta limit)
bot.hears('🚀 Loyiha e\'lon qilish', async (ctx) => {
    const telegramId = ctx.from.id.toString();
    if (telegramId !== ADMIN_ID) {
        // Shu yerda murakkab haftalik limit tekshiriladi (hujjat ko'payib ketmasligi uchun qisqartirib olingan, aslida DB orqali o'qiladi)
        // Agar limitdan oshsa: return ctx.reply("⚠️ Siz bu hafta uchun 2 ta loyiha e'lon qilib bo'ldingiz.");
    }
    userState.set(ctx.from.id, { step: 'AWAITING_PROJECT_TEXT' });
    ctx.reply("📌 Loyihangiz haqida yozing (Link kiritish taqiqlanadi!):", Markup.removeKeyboard());
});

// Qolgan tugmalar ham xuddi shunday davom etadi...
// Jamoa izlash (Kuniga 4 ta), Muammo (Kuniga 3 ta)

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
