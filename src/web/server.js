const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// ==========================================
// 🚀 PWA STANDALONE FIX
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "orientation": "portrait",
        "background_color": "#FAFAFA",
        "theme_color": "#10B981",
        "icons": [{"src": "/logo.jpg", "sizes": "512x512", "type": "image/jpeg", "purpose": "any maskable"}]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        self.addEventListener('install', (e) => { self.skipWaiting(); });
        self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
        self.addEventListener('fetch', (e) => { });
    `);
});

// ==========================================
// 🌿 ORGANIC ECO-FUTURISTIC DESIGN
// ==========================================
const headElements = `
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { 
            darkMode: 'class', 
            theme: { extend: { colors: { eco: '#10B981', ecodark: '#059669', ecoglow: '#A7F3D0', darkbg: '#022C22', darkcard: '#064E3B' } } } 
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
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.4s ease, color 0.4s ease; -webkit-tap-highlight-color: transparent; overflow-x: hidden; }
        
        /* 🌿 ORGANIC LIGHT MODE */
        body:not(.dark) { background-color: #FAFAFA; color: #0F172A; }
        body:not(.dark) .eco-glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.08); }
        
        /* 🌌 BIOLUMINESCENT DARK MODE */
        .dark body { background-color: #020617; color: #F8FAFC; }
        .dark .eco-glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(30px); -webkit-backdrop-filter: blur(30px); border: 1px solid rgba(16, 185, 129, 0.15); box-shadow: 0 20px 40px -10px rgba(16, 185, 129, 0.15); }

        /* 🦠 LIVING BACKGROUND BLOBS (Tirik fon) */
        .blob-1 { position: fixed; top: -10%; left: -10%; width: 50vw; height: 50vw; background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 60%); filter: blur(60px); z-index: -1; animation: float 12s ease-in-out infinite; }
        .blob-2 { position: fixed; bottom: -20%; right: -10%; width: 60vw; height: 60vw; background: radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 60%); filter: blur(80px); z-index: -1; animation: float 15s ease-in-out infinite reverse; }
        .dark .blob-1 { background: radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 60%); }
        .dark .blob-2 { background: radial-gradient(circle, rgba(5,150,105,0.2) 0%, transparent 60%); }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, 20px) scale(1.05); } 100% { transform: translate(0, 0) scale(1); } }

        /* 🟢 ECO BUTTONS & HOVERS */
        .btn-eco { background: linear-gradient(135deg, #10B981, #059669); color: white; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.4); border-radius: 9999px; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-eco:hover { transform: translateY(-3px); box-shadow: 0 15px 30px -5px rgba(16, 185, 129, 0.5); }
        
        .bento-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 2.5rem; }
        .bento-card:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.4); }
        .dark .bento-card:hover { box-shadow: 0 25px 50px -12px rgba(16, 185, 129, 0.25); border-color: rgba(16, 185, 129, 0.5); }

        /* Qatorlarni yo'qotish, pill shakl */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(16, 185, 129, 0.3); border-radius: 10px; }

        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: ecoSlideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
        .tab-content.active { display: block; }
        @keyframes ecoSlideUp { from { opacity: 0; transform: translateY(20px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    </style>
`;

const installScript = `
    <script>
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; });
        function handleInstall() {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                deferredPrompt.userChoice.then((choiceResult) => { if (choiceResult.outcome === 'accepted') deferredPrompt = null; });
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish uchun:\\n1. Pastdagi 'Ulashish' (Share) belgisini bosing.\\n2. 'Ekranga qo'shish' ni tanlang.");
                else alert("Ilova allaqachon o'rnatilgan yoki brauzer menyusidan 'Ekranga qo'shish' ni bosing.");
            }
        }
        document.querySelectorAll('.install-btn').forEach(btn => btn.addEventListener('click', handleInstall));
    </script>
`;

// ==========================================
// 1-XONA: LANDING PAGE (Organik Kutib olish)
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
        <body class="min-h-screen flex flex-col relative">
            <div class="blob-1"></div>
            <div class="blob-2"></div>
            
            <nav class="w-[90%] md:w-auto md:min-w-[600px] eco-glass fixed top-6 left-1/2 transform -translate-x-1/2 z-50 px-4 py-3 flex justify-between items-center rounded-full">
                <div class="flex items-center gap-3 pl-2">
                    <img src="/logo.jpg" alt="Logo" class="w-9 h-9 rounded-full object-cover shadow-sm">
                    <span class="text-lg font-extrabold tracking-tight hidden md:block">ADU Hub</span>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleTheme()" class="w-10 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500 transition">
                        <i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i>
                    </button>
                    <button class="install-btn btn-eco px-6 py-2.5 font-bold text-sm flex items-center gap-2">
                        <i class="fas fa-download"></i> <span class="hidden md:inline">Ilovani olish</span>
                    </button>
                </div>
            </nav>
            
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-8 inline-block px-5 py-2 rounded-full eco-glass border border-eco/30 text-eco font-bold text-xs uppercase tracking-widest shadow-sm">
                    <span class="w-2 h-2 inline-block bg-eco rounded-full animate-pulse mr-2"></span>Yopiq Beta Ekotizim
                </div>
                
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight">
                    Tabiiy iqtidorlardan <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-eco to-blue-500">Global startaplarga.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-14 leading-relaxed font-medium">Platforma qoidasi oddiy: Faqat Andijon Davlat Universiteti pochtasiga ega bo'lganlar qabul qilinadi.</p>
                
                <div class="flex flex-wrap justify-center gap-6 mb-16">
                    <div class="eco-glass px-10 py-6 rounded-[2rem] flex flex-col items-center min-w-[160px]"><span class="text-4xl font-black">${totalUsers}</span><span class="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest">A'zolar</span></div>
                    <div class="eco-glass px-10 py-6 rounded-[2rem] flex flex-col items-center min-w-[160px] relative overflow-hidden">
                        <div class="absolute inset-0 bg-eco/5"></div>
                        <span class="text-4xl font-black text-eco relative z-10">${activeProjects}</span>
                        <span class="text-[10px] text-slate-500 uppercase font-bold mt-2 tracking-widest relative z-10">Startaplar</span>
                    </div>
                </div>
                
                <a href="/app" class="btn-eco px-10 py-5 text-lg font-bold flex items-center gap-3 shadow-[0_20px_40px_-10px_rgba(16,185,129,0.5)]">
                    Katalog va Ilovani ochish <i class="fas fa-arrow-right"></i>
                </a>
            </main>
            ${installScript}
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

// ==========================================
// 2-XONA: HAQIQIY ILOVA (Eco-Futuristic App)
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
        <body class="flex h-screen overflow-hidden relative">
            <div class="blob-1"></div>
            <div class="blob-2"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-50/80 dark:bg-[#020617]/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-3xl">
                <div class="eco-glass p-10 rounded-[3rem] max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                    <div class="absolute -top-10 -right-10 w-32 h-32 bg-eco/20 rounded-full blur-2xl"></div>
                    <img src="/logo.jpg" alt="Logo" class="w-24 h-24 rounded-full mx-auto mb-6 shadow-xl object-cover border-4 border-white/50 dark:border-slate-800/50 relative z-10">
                    <h2 class="text-3xl font-extrabold mb-2 relative z-10 tracking-tight">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm relative z-10">Korporativ pochtani tasdiqlang</p>
                    
                    <div class="space-y-4 relative z-10">
                        <input id="loginEmail" type="email" placeholder="Pochta manzili" class="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-full px-6 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco/50 transition font-medium">
                        <input id="loginCode" type="password" placeholder="Maxfiy kod (OTP)" class="w-full bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-full px-6 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-eco/50 transition font-medium">
                    </div>
                    
                    <button onclick="checkLogin()" class="btn-eco w-full py-4 mt-8 font-bold text-lg relative z-10">Tasdiqlash</button>
                    <p id="authErrorMsg" class="text-rose-500 text-sm mt-4 hidden font-bold relative z-10 animate-bounce"><i class="fas fa-exclamation-circle"></i> Ma'lumot xato!</p>
                </div>
            </div>

            <aside class="w-[100px] lg:w-[280px] my-6 ml-6 eco-glass rounded-[2.5rem] flex flex-col hidden md:flex z-20 overflow-hidden shadow-2xl transition-all duration-300">
                <div class="p-6 flex justify-center lg:justify-start items-center gap-3 border-b border-slate-200/50 dark:border-slate-700/30">
                    <img src="/logo.jpg" alt="Logo" class="w-12 h-12 rounded-full object-cover shadow-sm">
                    <h1 class="text-xl font-extrabold hidden lg:block tracking-tight">ADU Hub</h1>
                </div>
                
                <nav class="flex-1 p-4 space-y-3 overflow-y-auto">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center justify-center lg:justify-start gap-4 p-4 rounded-full text-left font-bold active-tab bg-white dark:bg-slate-800/80 shadow-sm text-eco transition-all"><i class="fas fa-leaf text-xl w-6 text-center"></i> <span class="hidden lg:block">Ekotizim</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center justify-center lg:justify-start gap-4 p-4 text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40 rounded-full text-left font-bold transition-all"><i class="fas fa-rocket text-xl w-6 text-center"></i> <span class="hidden lg:block">Startaplar</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center justify-center lg:justify-start gap-4 p-4 text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40 rounded-full text-left font-bold transition-all"><i class="fas fa-dna text-xl w-6 text-center"></i> <span class="hidden lg:block">Iqtidorlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center justify-center lg:justify-start gap-4 p-4 text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40 rounded-full text-left font-bold transition-all"><i class="fas fa-bolt text-xl w-6 text-center"></i> <span class="hidden lg:block">Muammolar</span></button>
                </nav>
                <div class="p-4 border-t border-slate-200/50 dark:border-slate-700/30 flex flex-col gap-3">
                    <button class="install-btn btn-eco w-full py-3 rounded-full flex justify-center items-center gap-2 font-bold"><i class="fas fa-download"></i> <span class="hidden lg:block">O'rnatish</span></button>
                    <button onclick="toggleTheme()" class="w-full flex items-center justify-center lg:justify-start gap-4 p-4 text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/40 rounded-full font-bold transition-all">
                        <i class="fas fa-moon dark:hidden text-xl w-6 text-center"></i><i class="fas fa-sun hidden dark:block text-amber-400 text-xl w-6 text-center"></i> <span class="hidden lg:block">Mavzu</span>
                    </button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-32 md:p-10 z-10 relative">
                
                <div class="md:hidden flex justify-between items-center mb-8 px-2">
                    <img src="/logo.jpg" class="w-12 h-12 rounded-full shadow-sm">
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="w-12 h-12 rounded-full eco-glass flex items-center justify-center text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                        <button class="install-btn w-12 h-12 rounded-full btn-eco flex items-center justify-center"><i class="fas fa-download"></i></button>
                    </div>
                </div>

                <div class="eco-glass p-2 rounded-full mb-10 flex flex-col md:flex-row gap-2 items-center sticky top-2 z-30 shadow-sm">
                    <div class="relative w-full">
                        <i class="fas fa-search absolute left-6 top-1/2 transform -translate-y-1/2 text-eco"></i>
                        <input type="text" id="searchInput" onkeyup="filterItems()" placeholder="Platformadan izlash..." class="w-full bg-transparent border-none pl-14 pr-6 py-4 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400 font-medium">
                    </div>
                    <select id="categoryFilter" onchange="filterItems()" class="w-full md:w-auto bg-white/50 dark:bg-slate-800/50 rounded-full px-6 py-3 text-slate-700 dark:text-slate-300 font-bold focus:outline-none cursor-pointer border border-transparent hover:border-eco/30 transition">
                        <option value="all">Barcha toifalar</option>
                        <option value="dasturchi">Dasturchi</option>
                        <option value="dizayner">Dizayner</option>
                        <option value="sotuv">Sotuv</option>
                        <option value="smm">Marketing</option>
                    </select>
                </div>

                <div id="dashboard" class="tab-content active">
                    <div class="mb-10 pl-2">
                        <h2 class="text-4xl font-extrabold mb-2 tracking-tight">Ekotizim Holati</h2>
                        <p class="text-slate-500 dark:text-slate-400 font-medium">Platformaning jonli raqamlari</p>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        <div class="eco-glass p-8 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform">
                            <div class="absolute -right-4 -top-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                            <h3 class="text-4xl font-black mb-2 relative z-10">${totalUsers}</h3>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">A'zolar</p>
                        </div>
                        <div class="eco-glass p-8 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform">
                            <div class="absolute -right-4 -top-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>
                            <h3 class="text-4xl font-black text-amber-500 mb-2 relative z-10">${teamBuilding}</h3>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">Jamoa bosqichi</p>
                        </div>
                        <div class="eco-glass p-8 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform">
                            <div class="absolute -right-4 -top-4 w-20 h-20 bg-purple-500/10 rounded-full blur-xl group-hover:bg-purple-500/20 transition-all"></div>
                            <h3 class="text-4xl font-black text-purple-500 mb-2 relative z-10">${mvpStage}</h3>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">MVP bosqichi</p>
                        </div>
                        <div class="eco-glass p-8 rounded-[2.5rem] relative overflow-hidden group hover:-translate-y-2 transition-transform border border-eco/30">
                            <div class="absolute -right-4 -top-4 w-24 h-24 bg-eco/20 rounded-full blur-xl group-hover:bg-eco/40 transition-all"></div>
                            <h3 class="text-4xl font-black text-eco mb-2 relative z-10">${launched}</h3>
                            <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest relative z-10">Ishga tushgan</p>
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-4xl font-extrabold mb-8 tracking-tight pl-2">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projectsGrid">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="filterable-item bento-card eco-glass p-8 cursor-pointer flex flex-col justify-between" data-title="${p.title.toLowerCase()}" data-category="all" onclick="openModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')">
                                <div>
                                    <div class="w-12 h-12 rounded-full bg-eco/10 text-eco flex items-center justify-center mb-6 text-xl"><i class="fas fa-seedling"></i></div>
                                    <h3 class="text-2xl font-bold mb-3 tracking-tight">${p.title}</h3>
                                    <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed font-medium">${p.goal}</p>
                                </div>
                                <div class="mt-8 flex items-center justify-between">
                                    <span class="text-[10px] font-bold uppercase tracking-widest text-eco">Batafsil ko'rish</span>
                                    <div class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400"><i class="fas fa-arrow-right text-xs"></i></div>
                                </div>
                            </div>
                        `).join('') : '<p class="text-slate-500 pl-2">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-4xl font-extrabold mb-8 tracking-tight pl-2">Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => {
                            let cat = "dasturchi"; let color="blue"; let icon="fa-code";
                            let lower = r.skills.toLowerCase();
                            if(lower.includes("dizayn") || lower.includes("figma")) {cat = "dizayner"; color="purple"; icon="fa-palette";}
                            if(lower.includes("sotuv") || lower.includes("menejer")) {cat = "sotuv"; color="amber"; icon="fa-chart-line";}
                            if(lower.includes("smm") || lower.includes("marketing")) {cat = "smm"; color="rose"; icon="fa-hashtag";}
                            return `
                        <div class="filterable-item bento-card eco-glass p-8" data-title="${r.skills.toLowerCase()}" data-category="${cat}">
                            <div class="flex justify-between items-start mb-6">
                                <div class="flex items-center gap-4">
                                    <img src="/logo.jpg" class="w-12 h-12 rounded-full object-cover grayscale opacity-50">
                                    <h3 class="text-xl font-bold">@${r.author.username || 'Talaba'}</h3>
                                </div>
                                <div class="w-10 h-10 rounded-full bg-${color}-500/10 text-${color}-500 flex items-center justify-center"><i class="fas ${icon}"></i></div>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">${r.skills}</p>
                        </div>`}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-4xl font-extrabold mb-8 tracking-tight pl-2">Kashfiyot (Muammolar)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="filterable-item bento-card eco-glass p-8 relative" data-title="${pr.description.toLowerCase()}" data-category="all">
                            <div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6"><i class="fas fa-lightbulb text-amber-500"></i></div>
                            <p class="text-slate-700 dark:text-slate-300 font-medium leading-relaxed mb-8 text-lg">"${pr.description}"</p>
                            <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Anonim kuzatuvchi</span>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden fixed bottom-6 left-1/2 transform -translate-x-1/2 w-[90%] z-50">
                <div class="eco-glass rounded-full flex justify-around items-center p-2 shadow-[0_10px_40px_rgba(16,185,129,0.15)]">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-3 rounded-full text-eco bg-eco/10 active-tab transition-all"><i class="fas fa-leaf text-xl"></i></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-3 rounded-full text-slate-400 transition-all"><i class="fas fa-rocket text-xl"></i></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-3 rounded-full text-slate-400 transition-all"><i class="fas fa-dna text-xl"></i></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-3 rounded-full text-slate-400 transition-all"><i class="fas fa-bolt text-xl"></i></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/40 dark:bg-slate-900/80 z-[60] hidden items-center justify-center p-4 backdrop-blur-md transition-opacity">
                <div class="eco-glass w-full max-w-2xl rounded-[3rem] p-8 md:p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/50 dark:bg-slate-800/50 text-slate-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition shadow-sm"><i class="fas fa-times text-xl"></i></button>
                    <h2 id="modalTitle" class="text-3xl md:text-4xl font-extrabold mb-10 pr-12 tracking-tight leading-tight">Sarlavha</h2>
                    
                    <div class="space-y-4 mb-10">
                        <div class="bg-white/60 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/30">
                            <h4 class="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i class="fas fa-exclamation-circle text-sm"></i> Muammo Sababi</h4>
                            <p id="modalCause" class="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">...</p>
                        </div>
                        <div class="bg-white/60 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/30">
                            <h4 class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i class="fas fa-bullseye text-sm"></i> Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">...</p>
                        </div>
                        <div class="bg-white/60 dark:bg-slate-800/40 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-700/30">
                            <h4 class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-2"><i class="fas fa-chart-pie text-sm"></i> Manfaatdorlar</h4>
                            <p id="modalBenefits" class="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="btn-eco w-full flex items-center justify-center gap-3 py-6 text-xl rounded-full shadow-xl">
                        Jamoaga qo'shilish <i class="fas fa-arrow-right"></i>
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
                        document.getElementById('authGateway').style.opacity = '0'; setTimeout(() => document.getElementById('authGateway').style.display = 'none', 400);
                    } else {
                        const err = document.getElementById('authErrorMsg');
                        err.classList.remove('hidden'); err.classList.remove('animate-bounce'); void err.offsetWidth; err.classList.add('animate-bounce');
                    }
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
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-white', 'dark:bg-slate-800/80', 'text-eco', 'shadow-sm'); el.classList.add('text-slate-500', 'dark:text-slate-400'); });
                    if(document.querySelector('.mobile-nav-item')) document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'bg-eco/10', 'text-eco'); el.classList.add('text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'bg-eco/10', 'text-eco'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-white', 'dark:bg-slate-800/80', 'text-eco', 'shadow-sm'); btn.classList.remove('text-slate-500', 'dark:text-slate-400'); }
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
