const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// PWA Sozlamalari
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "background_color": "#0f172a",
        "theme_color": "#3b82f6",
        "icons": [{"src": "https://cdn-icons-png.flaticon.com/512/2040/2040946.png", "sizes": "512x512", "type": "image/png"}]
    });
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { console.log('PWA o\'rnatildi'); });`);
});

// ==========================================
// 1-XONA: LANDING PAGE (Taqdimot sahifasi)
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | Innovatsiyalar Markazi</title>
            <link rel="manifest" href="/manifest.json">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #050505; color: #fff; margin: 0; overflow-x: hidden; }
                .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; 
                           background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                             linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                           background-size: 50px 50px; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); }
                .glow { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 80%; height: 50%; background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.3), transparent 70%); z-index: -1; }
                .glass { background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
                @media (display-mode: standalone) { .install-btn { display: none !important; } }
            </style>
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="grid-bg"></div><div class="glow"></div>
            <nav class="w-full glass fixed top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"><i class="fas fa-rocket"></i></div>
                    <span class="text-xl font-extrabold tracking-tight hidden md:block">ADU Hub</span>
                </div>
                <div class="flex items-center gap-3">
                    <button id="installBtnGlobal" class="install-btn flex items-center gap-2 bg-gradient-to-r from-blue-600 to-accent hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-500/20">
                        <i class="fas fa-download"></i> <span class="hidden md:inline">Ilovani o'rnatish</span>
                    </button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight">
                    Universitet g'oyalarini <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">ADU Startup Hub — iqtidorli talabalarni, dasturchilarni va g'oya egalarini birlashtiruvchi yopiq ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-4 mb-12">
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center"><span class="text-3xl font-black text-white">${totalUsers}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Elita A'zolar</span></div>
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center"><span class="text-3xl font-black text-blue-400">${activeProjects}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Faol Startaplar</span></div>
                </div>
                <div class="glass p-8 rounded-3xl max-w-lg w-full text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <h3 class="text-2xl font-bold mb-2">Platformaga o'tish</h3>
                    <p class="text-slate-400 text-sm mb-6">Loyihalar katalogini ko'rish va platformadan foydalanish uchun ichkariga kiring.</p>
                    <a href="/app" class="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-200 transition font-bold py-4 rounded-xl shadow-lg shadow-white/10">
                        <i class="fas fa-door-open text-blue-500 text-xl"></i> Tizimga kirish
                    </a>
                </div>
            </main>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

// ==========================================
// 2-XONA: HAQIQIY ILOVA VA LOGIN DARVOZASI
// ==========================================
app.get('/app', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const teamBuilding = await prisma.project.count({ where: { status: "TEAM_BUILDING" } });
        const mvpStage = await prisma.project.count({ where: { status: "MVP" } });
        const launched = await prisma.project.count({ where: { status: "LAUNCHED" } });

        const activeProjects = await prisma.project.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            <link rel="manifest" href="/manifest.json">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; overflow: hidden; }
                #canvas-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; opacity: 0.6; }
                .glass { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
                .tab-content { display: none; animation: fadeIn 0.3s ease-in-out; }
                .tab-content.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                @media (display-mode: standalone) { .install-btn { display: none !important; } }
            </style>
        </head>
        <body class="flex h-screen">
            <canvas id="canvas-bg"></canvas>

            <div id="authGateway" class="fixed inset-0 bg-slate-900 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-md">
                <div class="glass p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-slate-700">
                    <div class="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white mx-auto mb-6 shadow-lg shadow-blue-500/50"><i class="fas fa-lock"></i></div>
                    <h2 class="text-3xl font-extrabold text-white mb-2">Tizimga kirish</h2>
                    <p class="text-slate-400 mb-8 text-sm">Faqat ADU korporativ pochtalari uchun</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochtangizni kiriting" class="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-4 mb-4 text-white focus:outline-none focus:border-blue-500 transition">
                    <input id="loginCode" type="password" placeholder="Maxfiy kod (OTP)" class="w-full bg-slate-800/50 border border-slate-600 rounded-xl px-4 py-4 mb-6 text-white focus:outline-none focus:border-blue-500 transition">
                    
                    <button onclick="checkLogin()" class="w-full bg-gradient-to-r from-blue-600 to-accent hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-xl transition shadow-lg shadow-blue-500/20">Kirish</button>
                    <p id="authErrorMsg" class="text-rose-400 text-sm mt-4 hidden"><i class="fas fa-exclamation-circle"></i> Pochta yoki kod noto'g'ri!</p>
                </div>
            </div>

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 shadow-2xl border-r border-slate-700/50">
                <div class="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h1 class="text-3xl font-extrabold text-white flex items-center gap-3"><i class="fas fa-layer-group text-accent"></i> ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left font-semibold active-tab bg-slate-700/50 text-white"><i class="fas fa-chart-pie text-blue-400 text-xl w-6"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-rocket text-emerald-400 text-xl w-6"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-user-astronaut text-purple-400 text-xl w-6"></i> Kadrlari</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-fire text-rose-400 text-xl w-6"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10 relative">
                
                <div class="glass p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30">
                    <div class="relative w-full md:w-1/2">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterItems()" placeholder="Loyiha, iqtidor yoki so'z qidirish..." class="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-blue-500">
                    </div>
                    <select id="categoryFilter" onchange="filterItems()" class="w-full md:w-auto bg-slate-800/80 border border-slate-600 rounded-xl px-4 py-3 text-slate-300 focus:outline-none">
                        <option value="all">Barcha toifalar</option>
                        <option value="dasturchi">Dasturchi</option>
                        <option value="dizayner">Dizayner (UI/UX)</option>
                        <option value="sotuv">Sotuv menejeri</option>
                        <option value="smm">SMM / Marketing</option>
                        <option value="ai">Sun'iy Intellekt</option>
                    </select>
                </div>

                <div id="dashboard" class="tab-content active">
                    <h2 class="text-3xl font-extrabold text-white mb-6">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-blue-500"><p class="text-slate-400 text-xs font-bold uppercase mb-1">A'zolar</p><h3 class="text-3xl font-black">${totalUsers}</h3></div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-amber-500"><p class="text-slate-400 text-xs font-bold uppercase mb-1">Jamoa yig'moqda</p><h3 class="text-3xl font-black text-amber-400">${teamBuilding}</h3></div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-purple-500"><p class="text-slate-400 text-xs font-bold uppercase mb-1">MVP bosqichi</p><h3 class="text-3xl font-black text-purple-400">${mvpStage}</h3></div>
                        <div class="glass p-6 rounded-2xl border-t-4 border-t-emerald-500"><p class="text-slate-400 text-xs font-bold uppercase mb-1">Ishga tushdi</p><h3 class="text-3xl font-black text-emerald-400">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-white mb-6">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="projectsGrid">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="filterable-item glass p-6 rounded-2xl cursor-pointer hover:border-accent transition hover:-translate-y-1" data-title="${p.title.toLowerCase()}" data-category="dasturchi ai" onclick="openModal('project', '${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')">
                                <span class="text-xs font-bold px-3 py-1 rounded-md mb-4 inline-block text-emerald-400 bg-emerald-500/10">Batafsil ko'rish</span>
                                <h3 class="text-2xl font-bold text-white mb-2">${p.title}</h3>
                                <p class="text-slate-400 text-sm line-clamp-2"><span class="text-slate-500 font-bold">Maqsad:</span> ${p.goal}</p>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-white mb-6">Kadrlar va Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="talentsGrid">
                        ${resumes.map(r => {
                            // Soddalashtirilgan toifaga ajratish (matn ichidan qidirib)
                            let cat = "dasturchi";
                            let lower = r.skills.toLowerCase();
                            if(lower.includes("dizayn") || lower.includes("figma")) cat = "dizayner";
                            if(lower.includes("sotuv") || lower.includes("menejer")) cat = "sotuv";
                            if(lower.includes("smm") || lower.includes("marketing")) cat = "smm";
                            return `
                        <div class="filterable-item glass p-6 rounded-2xl border-l-4 border-l-purple-500" data-title="${r.skills.toLowerCase()}" data-category="${cat}">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-xl font-bold text-white"><i class="fas fa-user-circle text-purple-400 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                                <span class="text-[10px] uppercase font-bold text-purple-300 bg-purple-500/20 px-2 py-1 rounded-md">${cat}</span>
                            </div>
                            <p class="text-slate-300 text-sm">${r.skills}</p>
                        </div>`}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-white mb-6">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6" id="problemsGrid">
                        ${problems.map(pr => `
                        <div class="filterable-item glass p-6 rounded-2xl border-l-4 border-l-rose-500 relative" data-title="${pr.description.toLowerCase()}" data-category="all">
                            <i class="fas fa-user-secret absolute top-4 right-4 text-slate-600 text-2xl opacity-50"></i>
                            <p class="text-slate-300 mb-4 text-sm leading-relaxed">"${pr.description}"</p>
                            <span class="text-xs text-slate-500 font-bold uppercase">Muallif yashiringan</span>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden glass fixed bottom-0 left-0 w-full z-50 border-t border-slate-700/50 pb-safe">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-blue-500 active-tab"><i class="fas fa-chart-pie text-lg"></i><span class="text-[9px] font-bold">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-rocket text-lg"></i><span class="text-[9px] font-bold">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-user-astronaut text-lg"></i><span class="text-[9px] font-bold">Kadrlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-fire text-lg"></i><span class="text-[9px] font-bold">Muammo</span></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/90 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="glass w-full max-w-2xl rounded-3xl border border-slate-700/50 p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><i class="fas fa-times w-4 h-4 flex items-center justify-center"></i></button>
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-extrabold text-white mb-6 pr-8">Sarlavha</h2>
                    <div class="space-y-4 mb-8">
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-rose-400 uppercase mb-1">Muammo Sababi</h4><p id="modalCause" class="text-slate-300 text-sm">...</p></div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-emerald-400 uppercase mb-1">Asosiy Maqsad</h4><p id="modalGoal" class="text-slate-300 text-sm">...</p></div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-amber-400 uppercase mb-1">Manfaatdorlar</h4><p id="modalBenefits" class="text-slate-300 text-sm">...</p></div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30">
                        <i class="fab fa-telegram-plane text-xl"></i> Telegram orqali jamoaga qo'shilish
                    </a>
                </div>
            </div>

            <script>
                // 🔐 LOGIN DARVOZASI MANTIQI
                if(localStorage.getItem('adu_web_auth') === 'verified') {
                    document.getElementById('authGateway').style.display = 'none';
                }
                function checkLogin() {
                    const email = document.getElementById('loginEmail').value.trim();
                    const code = document.getElementById('loginCode').value.trim();
                    
                    // 🔑 MAXSUS ISTISNO (Siz uchun yashirin eshik)
                    if(email === 'admin@adu.uz' && code === '7777') {
                        localStorage.setItem('adu_web_auth', 'verified');
                        document.getElementById('authGateway').style.opacity = '0';
                        setTimeout(() => document.getElementById('authGateway').style.display = 'none', 300);
                    } else {
                        document.getElementById('authErrorMsg').classList.remove('hidden');
                    }
                }

                // 🔍 QIDIRUV VA TOIFALAR MANTIQI
                function filterItems() {
                    const searchText = document.getElementById('searchInput').value.toLowerCase();
                    const category = document.getElementById('categoryFilter').value;
                    const items = document.querySelectorAll('.filterable-item');

                    items.forEach(item => {
                        const title = item.getAttribute('data-title');
                        const itemCat = item.getAttribute('data-category');
                        
                        const matchText = title.includes(searchText);
                        const matchCategory = category === 'all' || itemCat.includes(category);

                        if(matchText && matchCategory) item.style.display = 'block';
                        else item.style.display = 'none';
                    });
                }

                // TABS & MODALS
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-slate-700/50', 'text-white'); el.classList.add('text-slate-300'); });
                    if(document.querySelector('.mobile-nav-item')) { document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-blue-500'); el.classList.add('text-slate-400'); }); }
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-blue-500'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-slate-700/50', 'text-white'); btn.classList.remove('text-slate-300'); }
                }
                function openModal(type, id, title, cause, goal, benefits) {
                    document.getElementById('modalTitle').innerText = title; document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal; document.getElementById('modalBenefits').innerText = benefits;
                    document.getElementById('modalActionBtn').href = "https://t.me/ADUStartupHubBot?start=req_" + id; 
                    document.getElementById('detailModal').classList.remove('hidden'); document.getElementById('detailModal').classList.add('flex');
                }
                function closeModal() { document.getElementById('detailModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('flex'); }

                // ANIMATSIYA
                const canvas = document.getElementById('canvas-bg'); const ctx = canvas.getContext('2d');
                let width, height, particles = [];
                function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
                window.addEventListener('resize', resize); resize();
                class Particle {
                    constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.size = Math.random() * 2 + 0.5; this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5; }
                    draw() { ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
                    update() { this.x += this.vx; this.y += this.vy; if(this.x < 0 || this.x > width) this.vx *= -1; if(this.y < 0 || this.y > height) this.vy *= -1; }
                }
                for (let i = 0; i < 80; i++) particles.push(new Particle());
                function animate() { ctx.clearRect(0, 0, width, height); for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); } requestAnimationFrame(animate); }
                animate();
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
