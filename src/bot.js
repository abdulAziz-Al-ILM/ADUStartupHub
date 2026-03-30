require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const express = require('express');
const { OpenAI } = require('openai');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const app = express();
const PORT = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ADMIN_ID = process.env.ADMIN_TELEGRAM_ID;

// =========================================================
// 🧠 AI MODERATSIYA (Aqlli Filtr)
// =========================================================
async function aiModerationCheck(text) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Sen qat'iy va aqlli moderatorsan. Matnda axloqsizlik, so'kinish yoki taqiqlangan reklama/spam linklar borligini tekshir. DIQQAT: Foydalanuvchi jamoa yig'ish uchun yuborgan 't.me/' yoki 'telegram.me/' bilan boshlanuvchi havolalarga RUXSAT BER. Boshqa har qanday veb-sayt havolalarini BLOKLA. Agar matn toza va faqat ruxsat etilgan havolalar bo'lsa 'TOZA', qoida buzulgan bo'lsa 'XATO' deb faqat bitta so'z qaytar." },
                { role: "user", content: text }
            ],
            max_tokens: 10
        });
        return response.choices[0].message.content.trim() === 'TOZA';
    } catch (error) {
        console.error("AI xatosi:", error);
        return true; 
    }
}

// =========================================================
// 🌐 ZAMONAVIY SAYT VA DASHBOARD (Analitika)
// =========================================================
app.get('/', async (req, res) => {
    try {
        // Tahlillar uchun barcha statistikalarni yig'amiz
        const totalUsers = await prisma.user.count();
        const bannedUsers = await prisma.user.count({ where: { isBanned: true } });
        
        const teamBuilding = await prisma.project.count({ where: { status: "TEAM_BUILDING" } });
        const mvpStage = await prisma.project.count({ where: { status: "MVP" } });
        const launched = await prisma.project.count({ where: { status: "LAUNCHED" } });
        const cancelled = await prisma.project.count({ where: { status: "CANCELLED" } });

        const activeProjects = await prisma.project.findMany({ 
            where: { status: { not: "CANCELLED" } },
            orderBy: { createdAt: 'desc' }, 
            include: { author: true } 
        });
        const cancelledProjects = await prisma.project.findMany({ 
            where: { status: "CANCELLED" },
            orderBy: { createdAt: 'desc' } 
        });
        
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | Tahlil va Bozor</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <script>tailwind.config = { darkMode: 'class', theme: { extend: { colors: { darkbg: '#0f172a', darkcard: '#1e293b', accent: '#3b82f6' } } } }</script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; overflow-x: hidden; }
                .glass { background: rgba(30, 41, 59, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.05); }
                .modal { display: none; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.9); z-index: 50; backdrop-filter: blur(8px); align-items: center; justify-content: center; opacity: 0; transition: opacity 0.3s; }
                .modal.active { display: flex; opacity: 1; }
                .tab-content { display: none; animation: fadeIn 0.4s ease-in-out; }
                .tab-content.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
            </style>
        </head>
        <body class="flex h-screen overflow-hidden">

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 shadow-2xl">
                <div class="p-8 border-b border-slate-700/50">
                    <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <i class="fas fa-layer-group text-accent"></i> ADU Hub
                    </h1>
                </div>
                <nav class="flex-1 p-6 space-y-3 overflow-y-auto">
                    <button onclick="switchTab('dashboard')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg active-tab"><i class="fas fa-chart-line w-6 text-blue-400"></i> Statistika</button>
                    <button onclick="switchTab('startups')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg"><i class="fas fa-rocket w-6 text-emerald-400"></i> Startaplar</button>
                    <button onclick="switchTab('talents')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg"><i class="fas fa-user-astronaut w-6 text-purple-400"></i> Mutaxassislar</button>
                    <button onclick="switchTab('problems')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg"><i class="fas fa-fire w-6 text-rose-400"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-6 md:p-10 relative">
                
                <div id="dashboard" class="tab-content active">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Platforma Tahlili (Dashboard)</h2>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-blue-500 text-center">
                            <p class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Jami a'zolar</p>
                            <h3 class="text-4xl font-black text-white">${totalUsers}</h3>
                            <p class="text-xs text-rose-400 mt-2"><i class="fas fa-ban"></i> ${bannedUsers} ta bloklangan</p>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-amber-500 text-center">
                            <p class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Jamoa Yig'moqda</p>
                            <h3 class="text-4xl font-black text-amber-400">${teamBuilding}</h3>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-purple-500 text-center">
                            <p class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">MVP Bosqichi</p>
                            <h3 class="text-4xl font-black text-purple-400">${mvpStage}</h3>
                        </div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-emerald-500 text-center">
                            <p class="text-slate-400 text-sm font-bold uppercase tracking-wider mb-2">Ishga Tushdi (Launched)</p>
                            <h3 class="text-4xl font-black text-emerald-400">${launched}</h3>
                        </div>
                    </div>

                    <div class="glass p-8 rounded-3xl mt-10 border border-rose-500/20">
                        <h3 class="text-2xl font-bold text-white mb-6 flex items-center gap-3"><i class="fas fa-skull-crossbones text-rose-500"></i> Bekor qilingan loyihalar (${cancelled} ta)</h3>
                        <div class="space-y-4 max-h-96 overflow-y-auto pr-4">
                            ${cancelledProjects.length > 0 ? cancelledProjects.map(c => `
                            <div class="bg-slate-800/50 p-4 rounded-xl border-l-4 border-rose-500">
                                <h4 class="font-bold text-white">${c.title}</h4>
                                <p class="text-slate-400 text-sm mt-1">SABAB: "${c.cancelReason || 'Ko\'rsatilmagan'}"</p>
                            </div>
                            `).join('') : '<p class="text-slate-500">Hozircha o\'lgan loyihalar yo\'q, hammasi joyida!</p>'}
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${activeProjects.length > 0 ? activeProjects.map(p => {
                            let statusColor = p.status === 'MVP' ? 'text-purple-400 bg-purple-500/10' : p.status === 'LAUNCHED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10';
                            let statusText = p.status === 'MVP' ? 'MVP Bosqichi' : p.status === 'LAUNCHED' ? 'Ishga Tushdi' : 'Jamoa Yig\'moqda';
                            return `
                            <div onclick="openModal('project', '${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', '${p.author.username || 'Maxfiy'}')" class="glass p-6 rounded-2xl cursor-pointer hover:border-accent transition hover:-translate-y-2 relative">
                                <span class="text-xs font-bold px-3 py-1 rounded-md mb-4 inline-block ${statusColor}">${statusText}</span>
                                <h3 class="text-2xl font-bold text-white mb-2">${p.title}</h3>
                                <p class="text-slate-400 text-sm line-clamp-3">${p.description}</p>
                            </div>
                        `}).join('') : '<p class="text-slate-500 italic">Faol loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Mutaxassislar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-purple-500">
                            <h3 class="text-xl font-bold text-white mb-2"><i class="fas fa-user-circle text-purple-400 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                            <p class="text-slate-300">${r.skills}</p>
                        </div>
                        `).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Dolzarb Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-rose-500">
                            <p class="text-slate-300 mb-4">"${pr.description}"</p>
                            <span class="text-xs text-slate-500">Taklif qildi: @${pr.author.username || 'Talaba'}</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </main>

            <div id="detailModal" class="modal p-4">
                <div class="bg-darkcard w-full max-w-3xl rounded-3xl border border-slate-700/50 p-8 relative shadow-2xl" id="modalContent">
                    <button onclick="closeModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><i class="fas fa-times w-5 h-5 flex items-center justify-center"></i></button>
                    <div class="mb-4 flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-white"><i class="fas fa-user"></i></div>
                        <div><p class="text-xs text-slate-400">Muallif</p><p id="modalAuthor" class="font-bold text-white">@username</p></div>
                    </div>
                    <h2 id="modalTitle" class="text-3xl font-extrabold text-white mb-4">Sarlavha</h2>
                    <div class="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-6"><p id="modalDesc" class="text-slate-300">Ma'lumot...</p></div>
                    <a id="modalActionBtn" href="#" class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl"><i class="fab fa-telegram-plane"></i> Jamoaga qo'shilish so'rovi</a>
                </div>
            </div>

            <script>
                function switchTab(id) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('nav button').forEach(el => el.classList.remove('active-tab', 'bg-slate-700/50', 'text-white'));
                    
                    document.getElementById(id).classList.add('active');
                    event.currentTarget.classList.add('active-tab', 'bg-slate-700/50', 'text-white');
                }
                function openModal(type, id, title, desc, author) {
                    document.getElementById('modalTitle').innerText = title;
                    document.getElementById('modalDesc').innerText = desc;
                    document.getElementById('modalAuthor').innerText = author !== 'null' ? '@' + author : 'Yashirin';
                    
                    const btn = document.getElementById('modalActionBtn');
                    if(type === 'project') {
                        btn.href = "https://t.me/BU_YERGA_BOT_USERNAME_YOZING?start=req_" + id; 
                        btn.style.display = 'flex';
                    } else { btn.style.display = 'none'; }
                    document.getElementById('detailModal').classList.add('active');
                }
                function closeModal() { document.getElementById('detailModal').classList.remove('active'); }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Tizimda nosozlik.");
    }
});

app.listen(PORT, () => console.log(`🌐 Sayt ${PORT}-portda yondi.`));

// =========================================================
// 🤖 TELEGRAM BOT VA MANTIQ
// =========================================================
const userState = new Map();

const mainMenu = Markup.keyboard([
    ['🚀 Loyiha yaratish', '🤝 Rezyume qoldirish'],
    ['❗ Muammo kiritish', '⚙️ Loyihalarim'],
    ['📊 Kabinet']
]).resize();

bot.start(async (ctx) => {
    const payload = ctx.startPayload; 
    const telegramId = ctx.from.id;
    
    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        if (!user) user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        if (user.isBanned) return ctx.reply("⛔️ Bloklangansiz.");

        if (payload && payload.startsWith('req_')) {
            const projectId = parseInt(payload.split('_')[1]);
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) return ctx.reply("⚠️ Loyiha topilmadi.", mainMenu);

            userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', targetProjectId: projectId });
            return ctx.reply(`🎯 *${project.title}* jamoasiga qiziqdingiz.\nRezyumengizni yozing:`, { parse_mode: 'Markdown' });
        }

        ctx.reply("🌟 Bosh menyu:", mainMenu);
        userState.delete(telegramId);
    } catch (error) { ctx.reply("Xatolik."); }
});

// --- MENYU TUGMALARI ---
bot.hears('🚀 Loyiha yaratish', async (ctx) => {
    userState.set(ctx.from.id, { step: 'AWAITING_PROJECT_TITLE' });
    ctx.reply("🚀 Loyihaning qisqacha nomini yozing:", Markup.removeKeyboard());
});

bot.hears('🤝 Rezyume qoldirish', async (ctx) => {
    userState.set(ctx.from.id, { step: 'AWAITING_RESUME_TEXT' });
    ctx.reply("👨‍💻 Ko'nikmalaringizni yozing:", Markup.removeKeyboard());
});

bot.hears('❗ Muammo kiritish', async (ctx) => {
    userState.set(ctx.from.id, { step: 'AWAITING_PROBLEM_TEXT' });
    ctx.reply("💡 Qanday muammo bor:", Markup.removeKeyboard());
});

bot.hears('📊 Kabinet', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    ctx.reply(`📊 ID: \`${user.telegramId}\`\nOgohlantirish: ${user.reportCount}/2`, { parse_mode: 'Markdown' });
});

// --- LOYIHALARNI BOSHQARISH ---
bot.hears('⚙️ Loyihalarim', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    const myProjects = await prisma.project.findMany({ where: { authorId: user.id, status: { not: "CANCELLED" } } });

    if (myProjects.length === 0) return ctx.reply("Sizda hozircha faol loyihalar yo'q.");

    let replyText = "⚙️ *Loyihalaringizni boshqaring:*\nQaysi loyihaning holatini o'zgartirmoqchisiz?";
    
    // Har bir loyiha uchun Inline tugma yasaymiz
    const buttons = myProjects.map(p => [Markup.button.callback(`${p.title} (${p.status})`, `manage_${p.id}`)]);
    
    ctx.reply(replyText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

// Loyihani tanlaganda chiqadigan harakatlar
bot.action(/manage_(\d+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    ctx.answerCbQuery();
    ctx.editMessageText("Harakatni tanlang:", Markup.inlineKeyboard([
        [Markup.button.callback("🚀 MVP Bosqichiga o'tdi", `status_${projectId}_MVP`)],
        [Markup.button.callback("🌟 Ishga Tushdi (Launched)", `status_${projectId}_LAUNCHED`)],
        [Markup.button.callback("❌ Loyihani bekor qilish", `cancel_${projectId}`)]
    ]));
});

// Statusni o'zgartirish (MVP, LAUNCHED)
bot.action(/status_(\d+)_([A-Z]+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    const newStatus = ctx.match[2];
    await prisma.project.update({ where: { id: projectId }, data: { status: newStatus } });
    ctx.answerCbQuery("Holat yangilandi!");
    ctx.editMessageText(`✅ Loyiha holati *${newStatus}* ga o'zgartirildi. Saytdagi statistika yangilandi.`, { parse_mode: 'Markdown' });
});

// Bekor qilish tugmasi bosilganda
bot.action(/cancel_(\d+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    userState.set(ctx.from.id, { step: 'AWAITING_CANCEL_REASON', targetProjectId: projectId });
    ctx.answerCbQuery();
    ctx.editMessageText("⚠️ Loyiha nega bekor bo'ldi? Tahlil uchun qisqacha sababini yozing (AI senzuradan o'tadi):");
});

// --- MATN MANTIQI (Hamma textlar shundan o'tadi) ---
bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return;

    const loadingMsg = await ctx.reply("⏳ AI tahlili...");
    const isClean = await aiModerationCheck(text);
    
    if (!isClean) {
        userState.delete(telegramId);
        return ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "⛔️ Matnda axloqsizlik yoki taqiqlangan link bor!");
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        if (state.step === 'AWAITING_PROJECT_TITLE') {
            userState.set(telegramId, { step: 'AWAITING_PROJECT_DESC', tempTitle: text });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Endi maqsadi va muammo yechimini yozing:");
        } 
        else if (state.step === 'AWAITING_PROJECT_DESC') {
            userState.set(telegramId, { step: 'AWAITING_PROJECT_LINK', tempTitle: state.tempTitle, tempDesc: text });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Telegram guruh havolasini (t.me/...) yuboring:");
        }
        else if (state.step === 'AWAITING_PROJECT_LINK') {
            await prisma.project.create({ data: { title: state.tempTitle, description: state.tempDesc, groupLink: text, authorId: user.id } });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "🎉 Loyiha joylandi!", mainMenu);
        }
        else if (state.step === 'AWAITING_REQUEST_TEXT' && state.targetProjectId) {
            const project = await prisma.project.findUnique({ where: { id: state.targetProjectId }, include: { author: true } });
            if (project) {
                await prisma.request.create({ data: { coverLetter: text, projectId: project.id, applicantId: user.id } });
                bot.telegram.sendMessage(Number(project.author.telegramId), `🔔 *Yangi nomzod!*\nLoyiha: ${project.title}\nNomzod: @${ctx.from.username || 'yashirin'}\nXati: ${text}\nGuruh: ${project.groupLink}`, { parse_mode: 'Markdown' });
                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Arizangiz yuborildi!", mainMenu);
            }
            userState.delete(telegramId);
        }
        // Loyihani bekor qilish sababini qabul qilish
        else if (state.step === 'AWAITING_CANCEL_REASON' && state.targetProjectId) {
            await prisma.project.update({ 
                where: { id: state.targetProjectId }, 
                data: { status: "CANCELLED", cancelReason: text } 
            });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Loyiha bekor qilindi va sababi statistikaga yozildi.", mainMenu);
        }
        else if (state.step === 'AWAITING_PROBLEM_TEXT' || state.step === 'AWAITING_RESUME_TEXT') {
            if (state.step === 'AWAITING_PROBLEM_TEXT') await prisma.problem.create({ data: { description: text, authorId: user.id } });
            if (state.step === 'AWAITING_RESUME_TEXT') await prisma.resume.create({ data: { skills: text, authorId: user.id } });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Qabul qilindi!", mainMenu);
        }
    } catch (error) {
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "❌ Xatolik.");
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
