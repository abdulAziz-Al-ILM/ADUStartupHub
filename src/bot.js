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
        console.error("AI Moderatsiya xatosi:", error);
        return true; // AI uzilib qolsa, tizim to'xtab qolmasligi uchun
    }
}

// =========================================================
// 🌐 ZAMONAVIY DARK MODE SAYT (Soff.uz uslubida)
// =========================================================
app.get('/', async (req, res) => {
    try {
        const projects = await prisma.project.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | G'oyalar bozori</title>
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
                ::-webkit-scrollbar { width: 8px; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
            </style>
        </head>
        <body class="flex h-screen overflow-hidden">

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 shadow-2xl">
                <div class="p-8 border-b border-slate-700/50">
                    <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
                        <i class="fas fa-layer-group text-accent"></i> ADU Hub
                    </h1>
                    <p class="text-slate-400 text-sm mt-2">Innovatsiyalar markazi</p>
                </div>
                <nav class="flex-1 p-6 space-y-3 overflow-y-auto">
                    <button onclick="switchTab('startups')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg active-tab"><i class="fas fa-rocket w-6 text-emerald-400"></i> Startaplar</button>
                    <button onclick="switchTab('talents')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg"><i class="fas fa-user-astronaut w-6 text-purple-400"></i> Mutaxassislar</button>
                    <button onclick="switchTab('problems')" class="w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold text-lg"><i class="fas fa-fire w-6 text-rose-400"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto bg-[#0f172a] p-6 md:p-10 relative">
                
                <div id="startups" class="tab-content active">
                    <div class="flex justify-between items-center mb-8">
                        <h2 class="text-4xl font-extrabold text-white">Faol Loyihalar</h2>
                        <span class="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full font-bold text-sm border border-emerald-500/30">${projects.length} ta loyiha</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${projects.length > 0 ? projects.map(p => `
                        <div onclick="openModal('project', '${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.description.replace(/'/g, "\\'")}', '${p.author.username || 'Maxfiy'}')" class="glass p-6 rounded-2xl cursor-pointer hover:border-accent transition hover:-translate-y-2 group relative overflow-hidden">
                            <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
                            <span class="text-xs font-bold text-accent bg-blue-500/10 px-3 py-1 rounded-md mb-4 inline-block">${p.category}</span>
                            <h3 class="text-2xl font-bold text-white mb-2">${p.title}</h3>
                            <p class="text-slate-400 text-sm line-clamp-3 mb-4 leading-relaxed">${p.description}</p>
                            <div class="flex items-center gap-2 text-xs text-slate-500 mt-auto pt-4 border-t border-slate-700/50">
                                <i class="fas fa-clock"></i> ${new Date(p.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                        `).join('') : '<p class="text-slate-500 italic">Hozircha ochiq loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Mutaxassislar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => `
                        <div onclick="openModal('resume', '${r.id}', 'Mutaxassis Rezyumesi', '${r.skills.replace(/'/g, "\\'")}', '${r.author.username || 'Maxfiy'}')" class="glass p-6 rounded-2xl cursor-pointer border-l-4 border-l-purple-500 hover:bg-slate-800/50 transition">
                            <h3 class="text-xl font-bold text-white mb-2"><i class="fas fa-user-circle text-purple-400 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                            <p class="text-slate-300 text-sm line-clamp-2">${r.skills}</p>
                        </div>
                        `).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-4xl font-extrabold text-white mb-8">Dolzarb Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-rose-500">
                            <p class="text-slate-300 text-base leading-relaxed mb-4">"${pr.description}"</p>
                            <span class="text-xs text-slate-500">Taklif qildi: @${pr.author.username || 'Talaba'}</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </main>

            <div id="detailModal" class="modal p-4">
                <div class="bg-darkcard w-full max-w-3xl rounded-3xl border border-slate-700/50 p-8 md:p-10 relative shadow-2xl transform scale-95 transition-transform" id="modalContent">
                    <button onclick="closeModal()" class="absolute top-6 right-6 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full transition"><i class="fas fa-times w-5 h-5 flex items-center justify-center"></i></button>
                    
                    <div class="mb-6 flex items-center gap-3">
                        <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl"><i class="fas fa-user-astronaut"></i></div>
                        <div>
                            <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Muallif</p>
                            <p id="modalAuthor" class="font-bold text-white text-lg">@username</p>
                        </div>
                    </div>
                    
                    <h2 id="modalTitle" class="text-3xl md:text-4xl font-extrabold text-white mb-6 leading-tight">Sarlavha</h2>
                    
                    <div class="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 mb-8">
                        <p id="modalDesc" class="text-slate-300 text-lg leading-relaxed whitespace-pre-wrap">Batafsil ma'lumot...</p>
                    </div>
                    
                    <a id="modalActionBtn" href="#" class="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-accent hover:from-blue-500 hover:to-blue-400 text-white font-bold text-lg py-5 rounded-2xl transition-all shadow-lg shadow-blue-500/25 transform hover:-translate-y-1">
                        <i class="fab fa-telegram-plane text-2xl"></i> Bot orqali jamoaga qo'shilish
                    </a>
                </div>
            </div>

            <script>
                function switchTab(id) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.getElementById(id).classList.add('active');
                }
                function openModal(type, id, title, desc, author) {
                    document.getElementById('modalTitle').innerText = title;
                    document.getElementById('modalDesc').innerText = desc;
                    document.getElementById('modalAuthor').innerText = author !== 'null' ? '@' + author : 'Yashirin profil';
                    
                    const btn = document.getElementById('modalActionBtn');
                    if(type === 'project') {
                        // Deep Linking - Botga yo'naltirish
                        btn.href = "https://t.me/BU_YERGA_BOT_USERNAME_YOZING?start=req_" + id; 
                        btn.style.display = 'flex';
                    } else {
                        btn.style.display = 'none';
                    }
                    
                    const modal = document.getElementById('detailModal');
                    modal.classList.add('active');
                    setTimeout(() => document.getElementById('modalContent').classList.replace('scale-95', 'scale-100'), 10);
                }
                function closeModal() { 
                    document.getElementById('modalContent').classList.replace('scale-100', 'scale-95');
                    setTimeout(() => document.getElementById('detailModal').classList.remove('active'), 200);
                }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Kechirasiz, tizimda nosozlik.");
    }
});

// Test ma'lumotlar
app.get('/api/seed', async (req, res) => {
    try {
        const dummy = await prisma.user.create({ data: { telegramId: 999999999n, username: "Soff_Admin" } });
        await prisma.project.create({ data: { title: "ADU Smart Campus", description: "Universitet hududida bo'sh auditoriyalarni topib beruvchi Telegram bot tizimi.", groupLink: "https://t.me/smartcampus_adu", authorId: dummy.id, category: "IT" } });
        await prisma.resume.create({ data: { skills: "Men Python va Django bo'yicha kuchli bilimga egaman. Jamoa qidiryapman.", authorId: dummy.id, category: "Backend" } });
        await prisma.problem.create({ data: { description: "Kutubxonada kerakli kitob bor-yo'qligini onlayn tekshirish imkoni yo'q.", authorId: dummy.id } });
        res.send("Test ma'lumotlar tayyor!");
    } catch (err) { res.send("Xatolik yoki ma'lumotlar bor."); }
});

app.listen(PORT, () => console.log(`🌐 Sayt ${PORT}-portda yondi.`));

// =========================================================
// 🤖 TELEGRAM BOT - SUHBAT VA MANTIQ (State Machine)
// =========================================================
const userState = new Map();

const mainMenu = Markup.keyboard([
    ['🚀 Loyiha yaratish', '🤝 Rezyume qoldirish'],
    ['❗ Muammo kiritish', '📊 Kabinet']
]).resize();

bot.start(async (ctx) => {
    const payload = ctx.startPayload; 
    const telegramId = ctx.from.id;
    const username = ctx.from.username || "yashirin";

    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        if (!user) user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username } });
        if (user.isBanned) return ctx.reply("⛔️ Akkauntingiz bloklangan.");

        // 1. Agar saytdan "Qo'shilish" bosib kelgan bo'lsa (Deep Link)
        if (payload && payload.startsWith('req_')) {
            const projectId = parseInt(payload.split('_')[1]);
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) return ctx.reply("⚠️ Bu loyiha topilmadi yoki o'chirilgan.", mainMenu);

            userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', targetProjectId: projectId });
            return ctx.reply(`🎯 *Siz "${project.title}" loyihasi jamoasiga qiziqish bildirdingiz!*\n\nIltimos, o'zingiz haqingizda, nima ish qila olishingiz va tajribangiz haqida qisqacha (Rezyume) yozib yuboring. \n_Bu xabar to'g'ridan-to'g'ri loyiha asoschisiga yuboriladi._`, { parse_mode: 'Markdown' });
        }

        // 2. Oddiy kirish
        const isAdmin = telegramId.toString() === ADMIN_ID;
        ctx.reply(isAdmin ? "👑 *Assalomu alaykum, Admin!*\nTizim to'liq sizning boshqaruvingizda." : "🌟 *ADU Startup Hub — G'oyalar va Iqtidorlar maydoniga xush kelibsiz!*\n\nQanday yordam bera olaman?", { parse_mode: 'Markdown', ...mainMenu });
        userState.delete(telegramId);
    } catch (error) {
        ctx.reply("Ma'lumotlar bazasiga ulanishda xato.");
    }
});

// --- LOYIHA YARATISH (Qadamma-qadam) ---
bot.hears('🚀 Loyiha yaratish', async (ctx) => {
    // Limit tekshiruvi (Admin bo'lmasa)
    if (ctx.from.id.toString() !== ADMIN_ID) {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
        if (user.projectsWeek >= 2) return ctx.reply("⚠️ Siz haftalik loyiha e'lon qilish limitiga (2 ta) yetib kelgansiz. Iltimos, bor loyihalaringiz ustida ishlang.");
    }

    userState.set(ctx.from.id, { step: 'AWAITING_PROJECT_TITLE' });
    ctx.reply("🚀 *Yangi Startap Loyiha yaratish!*\n\nBuning uchun avval jamoangiz bilan suhbatlashish uchun maxsus Telegram guruh ochishingiz kerak bo'ladi.\n\nTayyor bo'lsa, loyihangizning *qisqacha va jozibador nomini* yozing:", { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
});

bot.hears('🤝 Rezyume qoldirish', async (ctx) => {
    userState.set(ctx.from.id, { step: 'AWAITING_RESUME_TEXT' });
    ctx.reply("👨‍💻 *O'z ko'nikmalaringizni bozorga chiqaring!*\n\nNimalarni bilasiz? Qaysi dasturlash tili yoki dizayn dasturida ishlaysiz? Qisqacha rezyumengizni yozing:", { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
});

bot.hears('❗ Muammo kiritish', async (ctx) => {
    userState.set(ctx.from.id, { step: 'AWAITING_PROBLEM_TEXT' });
    ctx.reply("💡 *Atrofingizdagi qanday muammoni IT yoki biznes orqali hal qilish mumkin?*\n\nMuammoni aniq tasvirlab bering:", { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
});

bot.hears('📊 Kabinet', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    ctx.reply(`📊 *Shaxsiy Kabinet:*\n\n🆔 ID: \`${user.telegramId}\`\n🚀 E'lon qilingan loyihalar: ${user.projectsWeek}/2 (haftasiga)\n⚠️ Qoidabuzarlik: ${user.reportCount}/2`, { parse_mode: 'Markdown' });
});

// --- MATNLARNI QABUL QILISH VA QAYTA ISHLASH ZANJIRI ---
bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return;

    // AI Tekshiruvi
    const loadingMsg = await ctx.reply("⏳ Tahlil qilinmoqda...");
    const isClean = await aiModerationCheck(text);
    
    if (!isClean) {
        userState.delete(telegramId);
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "⛔️ *Qat'iy Ogohlantirish!* Matnda so'kinish yoki taqiqlangan veb-havola aniqlandi. (Faqat t.me havolalariga ruxsat beriladi).", { parse_mode: 'Markdown' });
        return ctx.reply("Asosiy menyuga qaytdingiz.", mainMenu);
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        // Loyiha: 1-qadam (Nomini qabul qilib, Tavsif so'rash)
        if (state.step === 'AWAITING_PROJECT_TITLE') {
            userState.set(telegramId, { step: 'AWAITING_PROJECT_DESC', tempTitle: text });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Nomi qabul qilindi.\n\nEndi ushbu loyihaning *maqsadi va muammo yechimini* batafsil tushuntirib bering:", { parse_mode: 'Markdown' });
        } 
        // Loyiha: 2-qadam (Tavsif qabul qilib, Guruh link so'rash)
        else if (state.step === 'AWAITING_PROJECT_DESC') {
            userState.set(telegramId, { step: 'AWAITING_PROJECT_LINK', tempTitle: state.tempTitle, tempDesc: text });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Tavsif qabul qilindi.\n\nEng muhim qadam: Ushbu loyiha uchun ochilgan *Telegram guruh havolasini* (t.me/...) yuboring. Qolganlar shu guruh orqali sizga qo'shiladi:", { parse_mode: 'Markdown' });
        }
        // Loyiha: 3-qadam (Linkni qabul qilib, Bazaga saqlash)
        else if (state.step === 'AWAITING_PROJECT_LINK') {
            if (!text.includes('t.me') && !text.includes('telegram.me')) {
                return ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "❌ Havola noto'g'ri. Iltimos haqiqiy Telegram guruh ssilkasini yuboring (masalan: t.me/guruh_nomi).");
            }
            
            await prisma.project.create({
                data: { title: state.tempTitle, description: state.tempDesc, groupLink: text, authorId: user.id }
            });
            
            if (telegramId.toString() !== ADMIN_ID) {
                await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { projectsWeek: user.projectsWeek + 1 } });
            }

            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "🎉 *Tabriklaymiz!* Loyihangiz platformaga muvaffaqiyatli joylandi va saytda ko'rinmoqda.", { parse_mode: 'Markdown' });
            ctx.reply("Asosiy menyu", mainMenu);
        }
        // Saytdan kelgan Qo'shilish so'rovi (Zanjir oxiri)
        else if (state.step === 'AWAITING_REQUEST_TEXT' && state.targetProjectId) {
            const project = await prisma.project.findUnique({ where: { id: state.targetProjectId }, include: { author: true } });
            if (project) {
                await prisma.request.create({ data: { coverLetter: text, projectId: project.id, applicantId: user.id } });
                
                // Loyiha asoschisiga boradi
                bot.telegram.sendMessage(Number(project.author.telegramId), `🔔 *Diqqat! Loyihangizga jamoa a'zosi qo'shilmoqchi!*\n\n*Loyiha:* ${project.title}\n*Nomzod:* @${ctx.from.username || 'yashirin'}\n\n*Uning xati (Rezyume):* _${text}_\n\n👇 Ma'qul kelsa, nomzodni guruhingizga qo'shib oling:\n${project.groupLink}`, { parse_mode: 'Markdown' });

                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Arizangiz loyiha asoschisiga muvaffaqiyatli yuborildi!");
            }
            userState.delete(telegramId);
            ctx.reply("Menyuga qaytdingiz.", mainMenu);
        }
        // Oddiy Muammo yoki Rezyume kiritish
        else if (state.step === 'AWAITING_PROBLEM_TEXT' || state.step === 'AWAITING_RESUME_TEXT') {
            if (state.step === 'AWAITING_PROBLEM_TEXT') await prisma.problem.create({ data: { description: text, authorId: user.id } });
            if (state.step === 'AWAITING_RESUME_TEXT') await prisma.resume.create({ data: { skills: text, authorId: user.id } });
            
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Ma'lumot qabul qilindi va saytga joylandi!");
            ctx.reply("Menyuga qaytdingiz.", mainMenu);
        }
    } catch (error) {
        console.error(error);
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "❌ Xatolik yuz berdi.");
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
