const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Public papkasini hammaga ochiq qilish (Logotip ishlashi uchun)
app.use(express.static(path.join(__dirname, '../../public')));

// ==========================================
// PWA Sozlamalari (Yangi Raketa Logosi)
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#10b981", // Eco yashil rang
        "icons": [{"src": "/logo.jpg", "sizes": "512x512", "type": "image/jpeg", "purpose": "any maskable"}]
    });
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { console.log('PWA o\'rnatildi'); });`);
});

// Universal CSS va Tema boshqaruvi skripti (Ikkala xona uchun)
const headElements = `
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { 
            darkMode: 'class', 
            theme: { extend: { colors: { eco: '#10b981', ecodark: '#059669', darkbg: '#0b1120' } } } 
        }
        // Tema xotirasini tekshirish
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        function toggleTheme() {
            document.documentElement.classList.toggle('dark');
            localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
        }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
        body { font-family: 'Plus Jakarta Sans', sans-serif; overflow-x: hidden; transition: background-color 0.3s, color 0.3s; }
        
        /* Organik Eco Minimalism (Light) */
        body:not(.dark) { background-color: #f8fafc; color: #1e293b; }
        body:not(.dark) .grid-bg { background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 30px 30px; }
        body:not(.dark) .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.03); }
        
        /* Dark Mode */
        .dark body { background-color: #0b1120; color: #f8fafc; }
        .dark .grid-bg { background-image: linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 50px 50px; }
        .dark .glass { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3); }

        .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); }
        .glow { position: fixed; top: -20%; left: 50%; transform: translateX(-50%); width: 80vw; height: 50vh; background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.15), transparent 70%); z-index: -1; pointer-events: none; }
        .dark .glow { background: radial-gradient(ellipse at top, rgba(16, 185, 129, 0.25), transparent 70%); }
        
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeIn 0.3s ease-in-out; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;

// O'rnatish logikasi skripti (iOS va Android qamrovi)
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
                deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') deferredPrompt = null;
                });
            } else {
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) {
                    alert("Ilovani iPhone'ga o'rnatish uchun:\\n1. Brauzer pastidagi 'Ulashish' (Share) belgisini bosing.\\n2. 'Ekranga qo'shish' (Add to Home Screen) ni tanlang.");
                } else {
                    alert("Ilova allaqachon o'rnatilgan yoki brauzeringiz bunga ruxsat bermayapti. Iltimos brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' tugmasini bosing.");
                }
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub</title>
            ${headElements}
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="grid-bg"></div><div class="glow"></div>
            <nav class="w-full glass fixed top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center border-b border-gray-200 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <img src="/logo.jpg" alt="Logo" class="w-10 h-10 rounded-2xl shadow-lg object-cover">
                    <span class="text-xl font-extrabold tracking-tight hidden md:block text-slate-800 dark:text-white">ADU Hub</span>
                </div>
                <div class="flex items-center gap-3">
                    <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-eco transition">
                        <i class="fas fa-moon dark:hidden"></i>
                        <i class="fas fa-sun hidden dark:block"></i>
                    </button>
                    <button class="install-btn flex items-center gap-2 bg-eco hover:bg-ecodark text-white px-4 py-2 rounded-xl font-bold text-sm transition shadow-lg shadow-eco/30">
                        <i class="fas fa-download"></i> <span class="hidden md:inline">O'rnatish</span>
                    </button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block p-1 px-4 rounded-full glass border border-eco/30 text-eco font-bold text-xs uppercase tracking-widest">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-slate-900 dark:text-white">
                    Universitet g'oyalarini <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-eco to-blue-500">Bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">ADU Startup Hub — iqtidorli talabalarni, dasturchilarni va g'oya egalarini birlashtiruvchi yopiq ekotizim.</p>
                
                <div class="flex flex-wrap justify-center gap-4 mb-12">
                    <div class="glass px-8 py-5 rounded-3xl flex flex-col items-center"><span class="text-4xl font-black text-slate-800 dark:text-white">${totalUsers}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Elita A'zolar</span></div>
                    <div class="glass px-8 py-5 rounded-3xl flex flex-col items-center"><span class="text-4xl font-black text-eco">${activeProjects}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Faol Startaplar</span></div>
                </div>
                
                <div class="glass p-8 rounded-[2rem] max-w-lg w-full text-left relative overflow-hidden">
                    <h3 class="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Platformaga o'tish</h3>
                    <p class="text-slate-500 dark:text-slate-400 text-sm mb-6">Loyihalar katalogini ko'rish va platformadan foydalanish uchun ichkariga kiring.</p>
                    <a href="/app" class="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-[1.02] transition-transform font-bold py-4 rounded-2xl shadow-xl">
                        <i class="fas fa-door-open text-eco text-xl"></i> Tizimga kirish
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
            <div class="grid-bg"></div><div class="glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/90 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-xl">
                <div class="glass p-8 rounded-[2.5rem] max-w-md w-full text-center shadow-2xl">
                    <img src="/logo.jpg" alt="Logo" class="w-20 h-20 rounded-3xl mx-auto mb-6 shadow-xl object-cover">
                    <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-2">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm">Faqat ADU korporativ pochtalari uchun</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochtangizni kiriting" class="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600 rounded-2xl px-4 py-4 mb-4 text-slate-800 dark:text-white focus:outline-none focus:border-eco transition">
                    <input id="loginCode" type="password" placeholder="Maxfiy kod (OTP)" class="w-full bg-white/50 dark:bg-slate-800/50 border border-gray-300 dark:border-slate-600 rounded-2xl px-4 py-4 mb-6 text-slate-800 dark:text-white focus:outline-none focus:border-eco transition">
                    
                    <button onclick="checkLogin()" class="w-full bg-eco hover:bg-ecodark text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-eco/30">Kirish</button>
                    <p id="authErrorMsg" class="text-rose-500 text-sm mt-4 hidden font-semibold"><i class="fas fa-exclamation-circle"></i> Pochta yoki kod noto'g'ri!</p>
                </div>
            </div>

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 border-r border-gray-200 dark:border-slate-700/50">
                <div class="p-6 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <img src="/logo.jpg" alt="Logo" class="w-10 h-10 rounded-xl object-cover">
                        <h1 class="text-2xl font-extrabold text-slate-800 dark:text-white">ADU Hub</h1>
                    </div>
                    <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition">
                        <i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i>
                    </button>
                </div>
                <div class="px-6 pb-4 border-b border-gray-200 dark:border-slate-700/50">
                    <button class="install-btn w-full flex items-center justify-center gap-2 bg-eco text-white px-4 py-3 rounded-xl font-bold transition shadow-lg shadow-eco/20">
                        <i class="fas fa-download"></i> Ilovani o'rnatish
                    </button>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left font-semibold active-tab bg-gray-200 dark:bg-slate-700/50 text-slate-900 dark:text-white"><i class="fas fa-chart-pie text-blue-500 text-xl w-6"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-rocket text-eco text-xl w-6"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-user-astronaut text-purple-500 text-xl w-6"></i> Kadrlari</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-fire text-rose-500 text-xl w-6"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10 relative">
                
                <div class="md:hidden flex justify-between items-center mb-6">
                    <img src="/logo.jpg" class="w-10 h-10 rounded-xl">
                    <div class="flex gap-2">
                        <button onclick="toggleTheme()" class="w-10 h-10 rounded-xl glass flex items-center justify-center text-slate-600 dark:text-slate-300"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
                        <button class="install-btn w-10 h-10 rounded-xl bg-eco text-white flex items-center justify-center shadow-lg"><i class="fas fa-download"></i></button>
                    </div>
                </div>

                <div class="glass p-3 rounded-2xl mb-8 flex flex-col md:flex-row gap-3 items-center sticky top-0 z-30">
                    <div class="relative w-full">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterItems()" placeholder="Qidirish..." class="w-full bg-transparent border-none px-12 py-3 text-slate-800 dark:text-white focus:outline-none placeholder-slate-400">
                    </div>
                    <div class="w-full md:w-[1px] md:h-8 bg-gray-300 dark:bg-slate-600 hidden md:block"></div>
                    <select id="categoryFilter" onchange="filterItems()" class="w-full md:w-auto bg-transparent border-none px-4 py-3 text-slate-600 dark:text-slate-300 font-semibold focus:outline-none">
                        <option value="all">Barcha toifalar</option>
                        <option value="dasturchi">Dasturchi</option>
                        <option value="dizayner">Dizayner</option>
                        <option value="sotuv">Sotuv</option>
                        <option value="smm">Marketing</option>
                    </select>
                </div>

                <div id="dashboard" class="tab-content active">
                    <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div class="glass p-6 rounded-2xl"><p class="text-slate-500 text-xs font-bold uppercase mb-1">A'zolar</p><h3 class="text-3xl font-black text-slate-800 dark:text-white">${totalUsers}</h3></div>
                        <div class="glass p-6 rounded-2xl"><p class="text-slate-500 text-xs font-bold uppercase mb-1">Jamoa yig'moqda</p><h3 class="text-3xl font-black text-amber-500">${teamBuilding}</h3></div>
                        <div class="glass p-6 rounded-2xl"><p class="text-slate-500 text-xs font-bold uppercase mb-1">MVP bosqichi</p><h3 class="text-3xl font-black text-purple-500">${mvpStage}</h3></div>
                        <div class="glass p-6 rounded-2xl"><p class="text-slate-500 text-xs font-bold uppercase mb-1">Ishga tushdi</p><h3 class="text-3xl font-black text-eco">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="projectsGrid">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="filterable-item glass p-6 rounded-3xl cursor-pointer hover:shadow-xl transition-all border-b-4 border-b-transparent hover:border-b-eco" data-title="${p.title.toLowerCase()}" data-category="all" onclick="openModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')">
                                <span class="text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block text-eco bg-eco/10">Startap</span>
                                <h3 class="text-xl font-bold text-slate-800 dark:text-white mb-2">${p.title}</h3>
                                <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-2">${p.goal}</p>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Kadrlari</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${resumes.map(r => {
                            let cat = "dasturchi"; let color="blue";
                            let lower = r.skills.toLowerCase();
                            if(lower.includes("dizayn") || lower.includes("figma")) {cat = "dizayner"; color="purple";}
                            if(lower.includes("sotuv") || lower.includes("menejer")) {cat = "sotuv"; color="amber";}
                            if(lower.includes("smm") || lower.includes("marketing")) {cat = "smm"; color="rose";}
                            return `
                        <div class="filterable-item glass p-6 rounded-3xl flex flex-col justify-between" data-title="${r.skills.toLowerCase()}" data-category="${cat}">
                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <h3 class="text-lg font-bold text-slate-800 dark:text-white"><i class="fas fa-user-circle text-${color}-500 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                                    <span class="text-[10px] uppercase font-bold text-${color}-600 dark:text-${color}-300 bg-${color}-500/10 px-2 py-1 rounded-md">${cat}</span>
                                </div>
                                <p class="text-slate-600 dark:text-slate-300 text-sm">${r.skills}</p>
                            </div>
                        </div>`}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-3xl font-extrabold text-slate-800 dark:text-white mb-6">Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${problems.map(pr => `
                        <div class="filterable-item glass p-6 rounded-3xl" data-title="${pr.description.toLowerCase()}" data-category="all">
                            <div class="flex gap-3 mb-2"><i class="fas fa-quote-left text-rose-300 dark:text-rose-900 text-2xl"></i></div>
                            <p class="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">${pr.description}</p>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden glass fixed bottom-0 left-0 w-full z-50 border-t border-gray-200 dark:border-slate-800 pb-safe">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-eco active-tab"><i class="fas fa-chart-pie text-lg"></i><span class="text-[10px] font-bold">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-rocket text-lg"></i><span class="text-[10px] font-bold">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-user-astronaut text-lg"></i><span class="text-[10px] font-bold">Kadrlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-fire text-lg"></i><span class="text-[10px] font-bold">Muammo</span></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 dark:bg-slate-900/90 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm transition-opacity">
                <div class="glass w-full max-w-2xl rounded-[2.5rem] p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-2xl font-extrabold text-slate-900 dark:text-white mb-6 pr-8">Sarlavha</h2>
                    <div class="space-y-3 mb-8">
                        <div class="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50"><h4 class="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-1">Muammo Sababi</h4><p id="modalCause" class="text-slate-700 dark:text-slate-300 text-sm font-medium">...</p></div>
                        <div class="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50"><h4 class="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1">Asosiy Maqsad</h4><p id="modalGoal" class="text-slate-700 dark:text-slate-300 text-sm font-medium">...</p></div>
                        <div class="bg-white/50 dark:bg-slate-800/50 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50"><h4 class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Manfaatdorlar</h4><p id="modalBenefits" class="text-slate-700 dark:text-slate-300 text-sm font-medium">...</p></div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-4 rounded-2xl shadow-xl hover:scale-[1.02] transition-transform">
                        <i class="fab fa-telegram-plane text-eco text-xl"></i> Jamoaga qo'shilish
                    </a>
                </div>
            </div>

            ${installScript}
            <script>
                if(localStorage.getItem('adu_web_auth') === 'verified') document.getElementById('authGateway').style.display = 'none';
                function checkLogin() {
                    if(document.getElementById('loginEmail').value.trim() === 'admin@adu.uz' && document.getElementById('loginCode').value.trim() === '7777') {
                        localStorage.setItem('adu_web_auth', 'verified');
                        document.getElementById('authGateway').style.opacity = '0'; setTimeout(() => document.getElementById('authGateway').style.display = 'none', 300);
                    } else document.getElementById('authErrorMsg').classList.remove('hidden');
                }
                function filterItems() {
                    const txt = document.getElementById('searchInput').value.toLowerCase();
                    const cat = document.getElementById('categoryFilter').value;
                    document.querySelectorAll('.filterable-item').forEach(i => {
                        i.style.display = (i.dataset.title.includes(txt) && (cat==='all' || i.dataset.category.includes(cat))) ? 'block' : 'none';
                    });
                }
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-gray-200', 'dark:bg-slate-700/50', 'text-slate-900', 'dark:text-white'); el.classList.add('text-slate-600', 'dark:text-slate-300'); });
                    if(document.querySelector('.mobile-nav-item')) document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-eco'); el.classList.add('text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-eco'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-gray-200', 'dark:bg-slate-700/50', 'text-slate-900', 'dark:text-white'); btn.classList.remove('text-slate-600', 'dark:text-slate-300'); }
                }
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
    } catch (error) { res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
