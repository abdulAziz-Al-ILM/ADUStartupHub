const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// ==========================================
// 🚀 PWA STANDALONE FIX (Haqiqiy ilova qilish)
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "orientation": "portrait",
        "background_color": "#F8FAFC",
        "theme_color": "#10B981",
        "icons": [{"src": "/logo.jpg", "sizes": "512x512", "type": "image/jpeg", "purpose": "any maskable"}]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    // MUHIM: Fetch event bo'lmasa Chrome ilova sifatida o'rnatmaydi!
    res.send(`
        self.addEventListener('install', (e) => { self.skipWaiting(); });
        self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
        self.addEventListener('fetch', (e) => { 
            // PWA statusini saqlab qolish uchun bo'sh bo'lsa ham fetch kerak
        });
    `);
});

// ==========================================
// 🎨 PREMIUM DIZAYN (CSS va Elementlar)
// ==========================================
const headElements = `
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { 
            darkMode: 'class', 
            theme: { extend: { colors: { eco: '#10B981', ecodark: '#059669' } } } 
        }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else { document.documentElement.classList.remove('dark'); }
        
        function toggleTheme() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s, color 0.3s; -webkit-tap-highlight-color: transparent; }
        
        /* LIGHT MODE - Toza, Premium Oq */
        body:not(.dark) { background-color: #F8FAFC; color: #0F172A; }
        body:not(.dark) .glass { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.05); }
        
        /* DARK MODE - Chuqur, Professional Qora */
        .dark body { background-color: #0B1120; color: #F8FAFC; }
        .dark .glass { background: rgba(17, 24, 39, 0.75); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.06); box-shadow: 0 4px 24px -8px rgba(0, 0, 0, 0.5); }

        /* Ambient Glow - Faqat orqa fonda nozik nur */
        .ambient-glow { position: fixed; top: -15%; left: 50%; transform: translateX(-50%); width: 70vw; height: 60vh; background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 60%); z-index: -1; pointer-events: none; filter: blur(50px); }
        .dark .ambient-glow { background: radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 60%); }

        /* Bento Grid Kartalar Hover Effekti */
        .bento-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .bento-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -12px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
        .dark .bento-card:hover { box-shadow: 0 20px 40px -12px rgba(16, 185, 129, 0.2); border-color: rgba(16, 185, 129, 0.4); }

        /* Ilova ichidan kirsagina o'rnatish tugmasi o'chadi */
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        
        /* Yumshoq animatsiya */
        .tab-content { display: none; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .tab-content.active { display: block; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;

const installScript = `
    <script>
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
        });
        function handleInstall() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') deferredPrompt = null; });
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish uchun:\\n1. Brauzer pastidagi 'Ulashish' (Share) belgisini bosing.\\n2. 'Ekranga qo'shish' (Add to Home Screen) ni tanlang.");
                else alert("Ilova allaqachon o'rnatilgan yoki brauzer bunga ruxsat bermayapti. Menyudan 'Ekranga qo'shish' ni bosing.");
            }
        }
        document.querySelectorAll('.install-btn').forEach(btn => btn.addEventListener('click', handleInstall));
    </script>
`;

// ==========================================
// 1-XONA: LANDING PAGE
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>ADU Startup Hub</title>
            ${headElements}
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="ambient-glow"></div>
            
            <nav class="w-full glass fixed top-0 z-50 px-5 md:px-10 py-4 flex justify-between items-center border-b border-slate-200/50 dark:border-slate-800/50">
                <div class="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" class="w-10 h-10 rounded-xl object-cover shadow-sm">
                    <span class="text-xl font-extrabold tracking-tight hidden md:block">ADU Hub</span>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-eco transition">
                        <i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i>
                    </button>
                    <button class="install-btn flex items-center gap-2 bg-eco hover:bg-ecodark text-white px-5 py-2.5 rounded-xl font-bold text-sm transition shadow-lg shadow-eco/20">
                        <i class="fas fa-download"></i> <span class="hidden md:inline">O'rnatish</span>
                    </button>
                </div>
            </nav>
            
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block px-5 py-1.5 rounded-full glass border border-eco/20 text-eco font-bold text-xs uppercase tracking-widest">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight">
                    Universitet g'oyalarini <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-eco to-blue-500">Bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, muhandislar va startap asoschilarining yopiq ekotizimi.</p>
                
                <div class="flex flex-wrap justify-center gap-5 mb-14">
                    <div class="glass px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px]"><span class="text-4xl font-black">${totalUsers}</span><span class="text-xs text-slate-500 uppercase font-bold mt-2 tracking-wider">A'zolar</span></div>
                    <div class="glass px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px] border-b-4 border-eco"><span class="text-4xl font-black text-eco">${activeProjects}</span><span class="text-xs text-slate-500 uppercase font-bold mt-2 tracking-wider">Startaplar</span></div>
                </div>
                
                <div class="glass p-8 md:p-10 rounded-[2.5rem] max-w-xl w-full text-center relative overflow-hidden shadow-2xl">
                    <div class="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6"><i class="fas fa-lock text-2xl text-blue-500"></i></div>
                    <h3 class="text-2xl font-bold mb-3">Tizimga kirish</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">Platforma imkoniyatlaridan faqat ro'yxatdan o'tganlar foydalana oladi.</p>
                    <a href="/app" class="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform font-bold py-4 rounded-2xl shadow-xl">
                        Katalog va Ilovani ochish <i class="fas fa-arrow-right"></i>
                    </a>
                </div>
            </main>
            ${installScript}
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

// ==========================================
// 2-XONA: HAQIQIY ILOVA (APP)
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
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            ${headElements}
        </head>
        <body class="flex h-screen overflow-hidden">
            <div class="ambient-glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-50/95 dark:bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-2xl">
                <div class="glass p-10 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl border border-white/20 dark:border-slate-700/50">
                    <img src="/logo.jpg" alt="Logo" class="w-24 h-24 rounded-[1.5rem] mx-auto mb-6 shadow-md object-cover">
                    <h2 class="text-3xl font-extrabold mb-2">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm">Korporativ pochtani tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili" class="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 mb-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco/50 transition">
                    <input id="loginCode" type="password" placeholder="Maxfiy kod (OTP)" class="w-full bg-white/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 mb-8 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco/50 transition">
                    
                    <button onclick="checkLogin()" class="w-full bg-eco hover:bg-ecodark text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-eco/30">Kirish</button>
                    <p id="authErrorMsg" class="text-rose-500 text-sm mt-4 hidden font-semibold"><i class="fas fa-exclamation-circle"></i> Ma'lumot xato!</p>
                </div>
            </div>

            <aside class="w-[280px] glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 border-r border-slate-200/50 dark:border-slate-800/50">
                <div class="p-6 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" class="w-10 h-10 rounded-xl object-cover shadow-sm">
                        <h1 class="text-xl font-extrabold">ADU Hub</h1>
                    </div>
                </div>
                <div class="px-6 pb-4">
                    <button class="install-btn w-full flex items-center justify-center gap-2 bg-eco text-white px-4 py-3 rounded-xl font-bold transition shadow-md shadow-eco/20 hover:bg-ecodark">
                        <i class="fas fa-download"></i> O'rnatish
                    </button>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-left font-semibold active-tab bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-white"><i class="fas fa-chart-pie text-blue-500 text-lg w-6"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-left font-semibold transition"><i class="fas fa-rocket text-eco text-lg w-6"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-left font-semibold transition"><i class="fas fa-user-astronaut text-purple-500 text-lg w-6"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl text-left font-semibold transition"><i class="fas fa-fire text-rose-500 text-lg w-6"></i> Muammolar</button>
                </nav>
                <div class="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <button onclick="toggleTheme()" class="w-full flex items-center gap-4 px-5 py-4 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-2xl font-semibold transition">
                        <i class="fas fa-moon dark:hidden text-lg w-6"></i><i class="fas fa-sun hidden dark:block text-amber-500 text-lg w-6"></i> Mavzu
                    </button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-28 md:p-10 z-10 relative">
                
                <div class="md:hidden flex justify-between items-center mb-6">
                    <img src="/logo.jpg" class="w-10 h-10 rounded-xl shadow-sm">
                    <div class="flex gap-2">
                        <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-sm"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
                        <button class="install-btn w-10 h-10 rounded-xl bg-eco text-white flex items-center justify-center shadow-md shadow-eco/20"><i class="fas fa-download"></i></button>
                    </div>
                </div>

                <div class="glass p-3 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center sticky top-0 z-30 shadow-sm">
                    <div class="relative w-full">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterItems()" placeholder="Qidirish..." class="w-full bg-transparent border-none px-12 py-3 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400">
                    </div>
                    <div class="w-full md:w-[1px] md:h-8 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                    <select id="categoryFilter" onchange="filterItems()" class="w-full md:w-auto bg-transparent border-none px-4 py-3 text-slate-600 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer">
                        <option value="all">Barcha toifalar</option>
                        <option value="dasturchi">Dasturchi</option>
                        <option value="dizayner">Dizayner</option>
                        <option value="sotuv">Sotuv</option>
                        <option value="smm">Marketing</option>
                    </select>
                </div>

                <div id="dashboard" class="tab-content active">
                    <h2 class="text-3xl font-extrabold mb-6 tracking-tight">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                        <div class="glass p-6 rounded-3xl"><div class="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4"><i class="fas fa-users text-blue-500"></i></div><h3 class="text-3xl font-black mb-1">${totalUsers}</h3><p class="text-slate-500 text-xs font-bold uppercase tracking-wider">A'zolar</p></div>
                        <div class="glass p-6 rounded-3xl"><div class="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mb-4"><i class="fas fa-hourglass-half text-amber-500"></i></div><h3 class="text-3xl font-black mb-1">${teamBuilding}</h3><p class="text-slate-500 text-xs font-bold uppercase tracking-wider">Jamoa kutmoqda</p></div>
                        <div class="glass p-6 rounded-3xl"><div class="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mb-4"><i class="fas fa-code text-purple-500"></i></div><h3 class="text-3xl font-black mb-1">${mvpStage}</h3><p class="text-slate-500 text-xs font-bold uppercase tracking-wider">MVP bosqichi</p></div>
                        <div class="glass p-6 rounded-3xl border-b-4 border-eco"><div class="w-10 h-10 rounded-full bg-eco/10 flex items-center justify-center mb-4"><i class="fas fa-rocket text-eco"></i></div><h3 class="text-3xl font-black mb-1">${launched}</h3><p class="text-slate-500 text-xs font-bold uppercase tracking-wider">Ishga tushdi</p></div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-3xl font-extrabold mb-6 tracking-tight">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projectsGrid">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="filterable-item bento-card glass p-6 rounded-3xl cursor-pointer flex flex-col justify-between" data-title="${p.title.toLowerCase()}" data-category="all" onclick="openModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')">
                                <div>
                                    <span class="text-[10px] font-bold px-3 py-1.5 rounded-full mb-4 inline-block text-eco bg-eco/10 border border-eco/20 tracking-wider uppercase">Loyiha</span>
                                    <h3 class="text-xl font-bold mb-2 tracking-tight">${p.title}</h3>
                                    <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">${p.goal}</p>
                                </div>
                                <div class="mt-6 flex justify-end text-slate-400"><i class="fas fa-arrow-right"></i></div>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-3xl font-extrabold mb-6 tracking-tight">Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => {
                            let cat = "dasturchi"; let color="blue";
                            let lower = r.skills.toLowerCase();
                            if(lower.includes("dizayn") || lower.includes("figma")) {cat = "dizayner"; color="purple";}
                            if(lower.includes("sotuv") || lower.includes("menejer")) {cat = "sotuv"; color="amber";}
                            if(lower.includes("smm") || lower.includes("marketing")) {cat = "smm"; color="rose";}
                            return `
                        <div class="filterable-item bento-card glass p-6 rounded-3xl" data-title="${r.skills.toLowerCase()}" data-category="${cat}">
                            <div class="flex justify-between items-start mb-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700"><i class="fas fa-user text-slate-500"></i></div>
                                    <h3 class="text-lg font-bold">@${r.author.username || 'Talaba'}</h3>
                                </div>
                                <span class="text-[10px] uppercase font-bold text-${color}-600 dark:text-${color}-400 bg-${color}-50 dark:bg-${color}-900/20 px-3 py-1 rounded-full border border-${color}-200 dark:border-${color}-900/50 tracking-wider">${cat}</span>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${r.skills}</p>
                        </div>`}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-3xl font-extrabold mb-6 tracking-tight">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="filterable-item bento-card glass p-6 rounded-3xl relative" data-title="${pr.description.toLowerCase()}" data-category="all">
                            <div class="absolute top-6 right-6 w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center"><i class="fas fa-mask text-rose-500"></i></div>
                            <p class="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed pr-10 mb-6">"${pr.description}"</p>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Anonim Muallif</span>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden glass fixed bottom-0 left-0 w-full z-50 border-t border-slate-200/50 dark:border-slate-800/50 pb-safe shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                <div class="flex justify-around items-center px-2 py-3">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-eco active-tab transition"><i class="fas fa-chart-pie text-xl mb-1"></i><span class="text-[10px] font-bold">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400 transition"><i class="fas fa-rocket text-xl mb-1"></i><span class="text-[10px] font-bold">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400 transition"><i class="fas fa-user-astronaut text-xl mb-1"></i><span class="text-[10px] font-bold">Kadrlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400 transition"><i class="fas fa-fire text-xl mb-1"></i><span class="text-[10px] font-bold">Muammo</span></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                <div class="glass w-full max-w-2xl rounded-[2.5rem] p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto border border-white/40 dark:border-slate-700/50">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-3xl font-extrabold mb-8 pr-12 tracking-tight">Sarlavha</h2>
                    
                    <div class="space-y-4 mb-10">
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-exclamation-circle"></i> Muammo</h4>
                            <p id="modalCause" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-bullseye"></i> Maqsad</h4>
                            <p id="modalGoal" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-3xl border border-slate-200/50 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-chart-pie"></i> Manfaat</h4>
                            <p id="modalBenefits" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-5 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                        <i class="fab fa-telegram-plane text-eco text-xl"></i> Jamoaga qo'shilish
                    </a>
                </div>
            </div>

            ${installScript}
            <script>
                // 🔐 LOGIN LOGIC
                if(localStorage.getItem('adu_web_auth') === 'verified') document.getElementById('authGateway').style.display = 'none';
                function checkLogin() {
                    if(document.getElementById('loginEmail').value.trim() === 'admin@adu.uz' && document.getElementById('loginCode').value.trim() === '7777') {
                        localStorage.setItem('adu_web_auth', 'verified');
                        document.getElementById('authGateway').style.opacity = '0'; setTimeout(() => document.getElementById('authGateway').style.display = 'none', 300);
                    } else document.getElementById('authErrorMsg').classList.remove('hidden');
                }

                // 🔍 FILTER LOGIC
                function filterItems() {
                    const txt = document.getElementById('searchInput').value.toLowerCase();
                    const cat = document.getElementById('categoryFilter').value;
                    document.querySelectorAll('.filterable-item').forEach(i => {
                        i.style.display = (i.dataset.title.includes(txt) && (cat==='all' || i.dataset.category.includes(cat))) ? 'block' : 'none';
                    });
                }

                // 📱 TABS LOGIC
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-slate-100', 'dark:bg-slate-800/80', 'text-slate-900', 'dark:text-white'); el.classList.add('text-slate-500', 'dark:text-slate-400'); });
                    if(document.querySelector('.mobile-nav-item')) document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-eco'); el.classList.add('text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-eco'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-slate-100', 'dark:bg-slate-800/80', 'text-slate-900', 'dark:text-white'); btn.classList.remove('text-slate-500', 'dark:text-slate-400'); }
                }

                // 🖼 MODAL LOGIC
                function openModal(id, title, cause, goal, benefits) {
                    document.getElementById('modalTitle').innerText = title; document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal; document.getElementById('modalBenefits').innerText = benefits;
                    document.getElementById('modalActionBtn').href = "https://t.me/ADUStartupHubBot?start=req_" + id; 
                    document.getElementById('detailModal').classList.remove('hidden'); document.getElementById('detailModal').classList.add('flex');
                }
                function closeModal() { document.getElementById('detailModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('flex'); }
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { console.error(error); res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
