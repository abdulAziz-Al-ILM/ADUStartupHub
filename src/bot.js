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

// JSON qabul qilish uchun (Saytdan post yuborishga)
app.use(express.json());

// =========================================================
// 📱 PWA (PROGRESSIVE WEB APP) SOZLAMALARI
// =========================================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/",
        "display": "standalone",
        "background_color": "#0f172a",
        "theme_color": "#3b82f6",
        "icons": [{
            "src": "https://cdn-icons-png.flaticon.com/512/2040/2040946.png",
            "sizes": "512x512",
            "type": "image/png"
        }]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        self.addEventListener('install', (e) => { console.log('Ilova o\'rnatildi'); });
        self.addEventListener('fetch', (e) => { });
    `);
});

// =========================================================
// 🧠 AI MODERATSIYA
// =========================================================
async function aiModerationCheck(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,})/g;
    const allowedRegex = /(t\.me)|(telegram\.me)/g;
    const urls = text.match(urlRegex);
    if (urls) {
        const allAllowed = urls.every(url => allowedRegex.test(url));
        if (!allAllowed) return false;
    }
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Sen o'zbek tilidagi matnlarni tekshiruvchi qat'iy moderatorsan. Vazifang: Matn ichida haqorat, so'kinish borligini aniqlash. DIQQAT: 'online', 'sayt' kabi so'zlar mutlaqo xavfsiz. Faqat haqorat bo'lsagina 'XATO' deb qaytar, aks holda 'TOZA'." },
                { role: "user", content: text }
            ],
            max_tokens: 10, temperature: 0.1 
        });
        return response.choices[0].message.content.trim().toUpperCase().includes('TOZA');
    } catch (e) { return true; }
}

// =========================================================
// 🌐 ZAMONAVIY SAYT, ANIMATSIYA VA MOBIL ADAPTIVLIK
// =========================================================
app.get('/', async (req, res) => {
    try {
        const activeProjects = await prisma.project.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } }); // Author olinadi, lekin UI'da ko'rsatilmaydi

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>ADU Startup Hub</title>
            <link rel="manifest" href="/manifest.json">
            <meta name="theme-color" content="#0f172a">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <script>
                if('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
                tailwind.config = { darkMode: 'class', theme: { extend: { colors: { darkbg: '#0f172a', darkcard: '#1e293b', accent: '#3b82f6' } } } }
            </script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; overflow: hidden; }
                #canvas-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; opacity: 0.6; }
                .glass { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
                .tab-content { display: none; animation: fadeIn 0.3s ease-in-out; }
                .tab-content.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .mobile-nav-item.active-tab { color: #3b82f6; }
                
                /* Ekranga qo'shish xabari */
                #install-prompt { display: none; position: fixed; top: 20px; left: 50%; transform: translateX(-50%); z-index: 100; }
            </style>
        </head>
        <body class="flex h-screen">
            
            <canvas id="canvas-bg"></canvas>

            <div id="install-prompt" class="glass px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl border-accent/50 cursor-pointer hover:bg-slate-800 transition">
                <i class="fas fa-download text-accent"></i>
                <span class="font-bold text-sm">Ilovani ekranga o'rnatish</span>
            </div>

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 shadow-2xl border-r border-slate-700/50">
                <div class="p-8 border-b border-slate-700/50">
                    <h1 class="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3"><i class="fas fa-layer-group text-accent"></i> ADU Hub</h1>
                </div>
                <nav class="flex-1 p-6 space-y-3 overflow-y-auto">
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold active-tab bg-slate-700/50 text-white"><i class="fas fa-rocket w-6 text-emerald-400"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold"><i class="fas fa-user-astronaut w-6 text-purple-400"></i> Mutaxassislar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all text-left font-semibold"><i class="fas fa-fire w-6 text-rose-400"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-10 relative z-10">
                
                <div id="startups" class="tab-content active">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-6 md:mb-8">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div onclick="openModal('project', '${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')" class="glass p-6 rounded-2xl cursor-pointer hover:border-accent transition hover:-translate-y-1 relative group">
                                <div class="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition"></div>
                                <span class="text-xs font-bold px-3 py-1 rounded-md mb-4 inline-block text-emerald-400 bg-emerald-500/10">Batafsil ko'rish</span>
                                <h3 class="text-xl md:text-2xl font-bold text-white mb-2 relative z-10">${p.title}</h3>
                                <p class="text-slate-400 text-sm line-clamp-2 relative z-10"><span class="text-slate-500 font-bold">Maqsad:</span> ${p.goal}</p>
                            </div>
                        `).join('') : '<p class="text-slate-500 italic">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-8">Mutaxassislar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-purple-500">
                            <h3 class="text-xl font-bold text-white mb-2"><i class="fas fa-user-circle text-purple-400 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                            <p class="text-slate-300 text-sm">${r.skills}</p>
                        </div>
                        `).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-8">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-rose-500 relative">
                            <i class="fas fa-user-secret absolute top-4 right-4 text-slate-600 text-2xl opacity-50"></i>
                            <p class="text-slate-300 mb-4 pr-8 text-sm md:text-base leading-relaxed">"${pr.description}"</p>
                            <span class="text-xs text-slate-500 font-bold uppercase tracking-wider">Muallif yashiringan</span>
                        </div>
                        `).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden glass fixed bottom-0 left-0 w-full z-50 border-t border-slate-700/50 pb-safe">
                <div class="flex justify-around items-center p-4">
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400 active-tab"><i class="fas fa-rocket text-xl"></i><span class="text-[10px] font-bold">Loyihalar</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-user-astronaut text-xl"></i><span class="text-[10px] font-bold">Iqtidorlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-fire text-xl"></i><span class="text-[10px] font-bold">Muammolar</span></button>
                </div>
            </nav>

            <div id="detailModal" class="modal fixed inset-0 bg-slate-900/90 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="glass w-full max-w-2xl rounded-3xl border border-slate-700/50 p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><i class="fas fa-times w-4 h-4 flex items-center justify-center"></i></button>
                    
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-extrabold text-white mb-6 pr-8">Sarlavha</h2>
                    
                    <div class="space-y-4 mb-8">
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                            <h4 class="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1"><i class="fas fa-exclamation-circle"></i> Muammo Sababi</h4>
                            <p id="modalCause" class="text-slate-300 text-sm">...</p>
                        </div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                            <h4 class="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1"><i class="fas fa-bullseye"></i> Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-slate-300 text-sm">...</p>
                        </div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30">
                            <h4 class="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1"><i class="fas fa-chart-pie"></i> Manfaatdorlar</h4>
                            <p id="modalBenefits" class="text-slate-300 text-sm">...</p>
                        </div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-dashed border-accent/50 relative overflow-hidden">
                            <div class="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
                                <i class="fas fa-lock text-slate-500 mb-2"></i>
                                <span class="text-xs font-bold text-slate-400 uppercase">Yechim jamoa a'zolari uchun qulflangan</span>
                            </div>
                            <h4 class="text-xs font-bold text-accent uppercase tracking-wider mb-1">Maxfiy Yechim</h4>
                            <p class="text-slate-600 text-sm blur-sm">Bu joy maxfiy...</p>
                        </div>
                    </div>

                    <a id="modalActionBtn" href="#" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30">
                        <i class="fab fa-telegram-plane text-xl"></i> Jamoaga yozilish
                    </a>
                </div>
            </div>

            <script>
                // Tablar va Modallar logic
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-slate-700/50', 'text-white'); el.classList.add('text-slate-300'); });
                    if(document.querySelector('.mobile-nav-item')) {
                        document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-blue-500'); el.classList.add('text-slate-400'); });
                    }
                    
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) {
                        btn.classList.add('active-tab', 'text-blue-500');
                        btn.classList.remove('text-slate-400');
                    } else {
                        btn.classList.add('active-tab', 'bg-slate-700/50', 'text-white');
                        btn.classList.remove('text-slate-300');
                    }
                }

                function openModal(type, id, title, cause, goal, benefits) {
                    document.getElementById('modalTitle').innerText = title;
                    document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal;
                    document.getElementById('modalBenefits').innerText = benefits;
                    
                    const btn = document.getElementById('modalActionBtn');
                    btn.href = "https://t.me/BU_YERGA_BOT_USERNAME_YOZING?start=req_" + id; 
                    document.getElementById('detailModal').classList.remove('hidden');
                    document.getElementById('detailModal').classList.add('flex');
                }

                function closeModal() { 
                    document.getElementById('detailModal').classList.add('hidden');
                    document.getElementById('detailModal').classList.remove('flex');
                }

                // PWA O'rnatish logikasi
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    deferredPrompt = e;
                    document.getElementById('install-prompt').style.display = 'flex';
                });
                document.getElementById('install-prompt').addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') document.getElementById('install-prompt').style.display = 'none';
                        deferredPrompt = null;
                    }
                });

                // ZARRACHALAR (Particles) ANIMATSIYASI
                const canvas = document.getElementById('canvas-bg');
                const ctx = canvas.getContext('2d');
                let width, height, particles = [];
                
                function resize() {
                    width = canvas.width = window.innerWidth;
                    height = canvas.height = window.innerHeight;
                }
                window.addEventListener('resize', resize);
                resize();

                const mouse = { x: null, y: null, radius: 150 };
                window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
                window.addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; });
                window.addEventListener('mouseout', () => { mouse.x = null; mouse.y = null; });
                window.addEventListener('touchend', () => { mouse.x = null; mouse.y = null; });

                class Particle {
                    constructor() {
                        this.x = Math.random() * width;
                        this.y = Math.random() * height;
                        this.size = Math.random() * 2 + 0.5;
                        this.baseX = this.x; this.baseY = this.y;
                        this.density = (Math.random() * 30) + 1;
                        this.vx = (Math.random() - 0.5) * 0.5;
                        this.vy = (Math.random() - 0.5) * 0.5;
                    }
                    draw() {
                        ctx.fillStyle = 'rgba(59, 130, 246, 0.5)';
                        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.closePath(); ctx.fill();
                    }
                    update() {
                        this.x += this.vx; this.y += this.vy;
                        if(this.x < 0 || this.x > width) this.vx *= -1;
                        if(this.y < 0 || this.y > height) this.vy *= -1;

                        if (mouse.x != null) {
                            let dx = mouse.x - this.x; let dy = mouse.y - this.y;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < mouse.radius) {
                                const forceDirectionX = dx / distance; const forceDirectionY = dy / distance;
                                const maxDistance = mouse.radius; const force = (maxDistance - distance) / maxDistance;
                                const directionX = forceDirectionX * force * this.density;
                                const directionY = forceDirectionY * force * this.density;
                                this.x += directionX; this.y += directionY;
                            }
                        }
                    }
                }
                function init() { particles = []; for (let i = 0; i < 100; i++) particles.push(new Particle()); }
                function animate() {
                    ctx.clearRect(0, 0, width, height);
                    for (let i = 0; i < particles.length; i++) {
                        particles[i].update(); particles[i].draw();
                        for (let j = i; j < particles.length; j++) {
                            let dx = particles[i].x - particles[j].x; let dy = particles[i].y - particles[j].y;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < 100) {
                                ctx.beginPath(); ctx.strokeStyle = \`rgba(59, 130, 246, \${1 - distance/100})\`;
                                ctx.lineWidth = 0.5; ctx.moveTo(particles[i].x, particles[i].y);
                                ctx.lineTo(particles[j].x, particles[j].y); ctx.stroke(); ctx.closePath();
                            }
                        }
                    }
                    requestAnimationFrame(animate);
                }
                init(); animate();

            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Xatolik"); }
});

app.listen(PORT, () => console.log(`🌐 Server yondi.`));

// =========================================================
// 🤖 TELEGRAM BOT MANTIQI (Shablonli kiritish)
// =========================================================
const userState = new Map();
const mainMenu = Markup.keyboard([['🚀 Loyiha yaratish', '🤝 Rezyume'], ['❗ Muammo (Anonim)', '⚙️ Loyihalarim'], ['📊 Kabinet']]).resize();

bot.start(async (ctx) => {
    const payload = ctx.startPayload; 
    const telegramId = ctx.from.id;
    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        if (!user) user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        
        if (payload && payload.startsWith('req_')) {
            const projectId = parseInt(payload.split('_')[1]);
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) return ctx.reply("Loyiha topilmadi.");

            // 1x Qoida tekshiruvi: Agar oldin yozgan bo'lsa rad etadi
            const existingReq = await prisma.request.findFirst({ where: { projectId, applicantId: user.id } });
            if(existingReq) return ctx.reply("⚠️ Siz bu loyihaga allaqachon ariza yuborgansiz. Asoschi javobini kuting.", mainMenu);

            userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', targetProjectId: projectId });
            return ctx.reply(`🎯 *${project.title}* jamoasiga qiziqdingiz.\nRezyumengizni yozing:`, { parse_mode: 'Markdown' });
        }
        ctx.reply("🌟 Bosh menyu:", mainMenu);
        userState.delete(telegramId);
    } catch (error) { ctx.reply("Xatolik"); }
});

bot.hears('🚀 Loyiha yaratish', (ctx) => {
    userState.set(ctx.from.id, { step: 'PROJ_TITLE' });
    ctx.reply("🚀 Loyiha nomini yozing:", Markup.removeKeyboard());
});
bot.hears('🤝 Rezyume', (ctx) => {
    userState.set(ctx.from.id, { step: 'RESUME' });
    ctx.reply("👨‍💻 Ko'nikmalaringizni yozing:", Markup.removeKeyboard());
});
bot.hears('❗ Muammo (Anonim)', (ctx) => {
    userState.set(ctx.from.id, { step: 'PROBLEM' });
    ctx.reply("💡 Qanday muammo bor? (Sizning ismingiz saytda ko'rsatilmaydi):", Markup.removeKeyboard());
});

bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text;
    const state = userState.get(telegramId);

    if (!state) return;

    const isClean = await aiModerationCheck(text);
    if (!isClean) {
        userState.delete(telegramId);
        return ctx.reply("⛔️ Matnda xatolik bor!", mainMenu);
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        // Shablonli kiritish
        if (state.step === 'PROJ_TITLE') {
            userState.set(telegramId, { step: 'PROJ_CAUSE', data: { title: text } });
            ctx.reply("✅ Yaxshi. Endi ushbu loyihaga sabab bo'lgan asosiy muammoni yozing:");
        } 
        else if (state.step === 'PROJ_CAUSE') {
            state.data.cause = text;
            userState.set(telegramId, { step: 'PROJ_GOAL', data: state.data });
            ctx.reply("✅ Qabul. Loyihaning yakuniy maqsadi nima?");
        }
        else if (state.step === 'PROJ_GOAL') {
            state.data.goal = text;
            userState.set(telegramId, { step: 'PROJ_BENEFIT', data: state.data });
            ctx.reply("✅ Bozor kim? Bundan kim va qancha manfaat ko'radi?");
        }
        else if (state.step === 'PROJ_BENEFIT') {
            state.data.benefits = text;
            userState.set(telegramId, { step: 'PROJ_SOLUTION', data: state.data });
            ctx.reply("✅ Qabul. Yechim qanday? Buni qanday qilasiz? (Bu qism faqat jamoaga yozilganlar uchun ochiladi):");
        }
        else if (state.step === 'PROJ_SOLUTION') {
            state.data.solution = text;
            userState.set(telegramId, { step: 'PROJ_LINK', data: state.data });
            ctx.reply("✅ Eng so'nggi qadam: Jamoangiz bilan yozishish uchun ochilgan Telegram guruh havolasini yuboring (t.me/...):");
        }
        else if (state.step === 'PROJ_LINK') {
            await prisma.project.create({ 
                data: { 
                    title: state.data.title, problemCause: state.data.cause, goal: state.data.goal,
                    benefits: state.data.benefits, hiddenSolution: state.data.solution,
                    groupLink: text, authorId: user.id 
                } 
            });
            userState.delete(telegramId);
            ctx.reply("🎉 Loyiha saytga joylandi!", mainMenu);
        }
        // Xuddi Instagram kabi bitta arizani ushlash
        else if (state.step === 'AWAITING_REQUEST_TEXT' && state.targetProjectId) {
            try {
                await prisma.request.create({ data: { coverLetter: text, projectId: state.targetProjectId, applicantId: user.id } });
                ctx.reply("✅ Arizangiz loyiha muallifiga yuborildi!", mainMenu);
            } catch (e) {
                if (e.code === 'P2002') ctx.reply("⚠️ Siz allaqachon ariza yuborgansiz.", mainMenu); // Prisma Unique constraint xatosi
            }
            userState.delete(telegramId);
        }
        else if (state.step === 'PROBLEM' || state.step === 'RESUME') {
            if (state.step === 'PROBLEM') await prisma.problem.create({ data: { description: text, authorId: user.id } });
            if (state.step === 'RESUME') await prisma.resume.create({ data: { skills: text, authorId: user.id } });
            userState.delete(telegramId);
            ctx.reply("✅ Qabul qilindi!", mainMenu);
        }
    } catch (error) { ctx.reply("❌ Xatolik.", mainMenu); }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
