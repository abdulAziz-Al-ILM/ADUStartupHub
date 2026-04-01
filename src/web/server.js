const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// 🚀 PWA STANDALONE FIX (Muammo hal qilindi)
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "background_color": "#ffffff",
        "theme_color": "#2563eb", // Standart Startap Ko'k rangi
        "icons": [
            {
                // Ishonchli va o'chib ketmaydigan 3D Raketa logosi
                "src": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", 
                "sizes": "512x512", 
                "type": "image/png",
                "purpose": "any maskable"
            }
        ]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        self.addEventListener('install', (e) => { self.skipWaiting(); });
        self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); });
        self.addEventListener('fetch', (e) => { 
            // Chrome buni ilova deb tan olishi uchun bu qator shart!
            e.respondWith(fetch(e.request).catch(() => new Response('Internet yo\\'q')));
        });
    `);
});

// ==========================================
// 💻 STANDARD STARTUP DESIGN (Toza, professional)
// ==========================================
const headElements = `
    <link rel="manifest" href="/manifest.json">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { 
            darkMode: 'class', 
            theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8' } } } 
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
        
        /* Toza Light Mode */
        body:not(.dark) { background-color: #f8fafc; color: #0f172a; }
        .card-light { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        
        /* Chuqur Dark Mode */
        .dark body { background-color: #0f172a; color: #f8fafc; }
        .dark .card-light { background: #1e293b; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

        /* Standart Startap Orqa Foni (Faqat tepada kichik nur) */
        .header-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 40vh; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%); z-index: -1; pointer-events: none; }
        .dark .header-glow { background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); }

        /* Smooth hover */
        .hover-card { transition: all 0.2s ease; }
        .hover-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-color: #3b82f6; }
        .dark .hover-card:hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-color: #3b82f6; }

        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeIn 0.3s ease; }
        .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish uchun:\\n1. Brauzer pastidagi 'Ulashish' belgisini bosing.\\n2. 'Ekranga qo'shish' ni tanlang.");
                else alert("Ilova allaqachon o'rnatilgan yoki brauzer menyusidan 'Ekranga qo'shish' ni bosing.");
            }
        }
        document.querySelectorAll('.install-btn').forEach(btn => btn.addEventListener('click', handleInstall));
    </script>
`;

const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

// ==========================================
// 1-XONA: LANDING PAGE (SaaS Style)
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
        <body class="min-h-screen flex flex-col relative">
            <div class="header-glow"></div>
            
            <nav class="w-full card-light fixed top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3">
                    <img src="${LOGO_URL}" alt="Logo" class="w-8 h-8 object-contain">
                    <span class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">ADU Hub</span>
                </div>
                <div class="flex items-center gap-4">
                    <button onclick="toggleTheme()" class="text-slate-500 hover:text-brand transition"><i class="fas fa-moon dark:hidden text-lg"></i><i class="fas fa-sun hidden dark:block text-lg"></i></button>
                    <button class="install-btn bg-brand hover:bg-brandhover text-white px-5 py-2 rounded-lg font-semibold text-sm transition shadow-sm">Ilovani olish</button>
                </div>
            </nav>
            
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-brand font-semibold text-xs tracking-wide">Beta Versiya</div>
                
                <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight max-w-3xl mx-auto tracking-tight text-slate-900 dark:text-white">
                    Universitet g'oyalarini <span class="text-brand">bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-light px-8 py-6 rounded-2xl flex flex-col items-center min-w-[160px]"><span class="text-3xl font-black text-slate-900 dark:text-white">${totalUsers}</span><span class="text-xs text-slate-500 font-semibold mt-1">Faol a'zolar</span></div>
                    <div class="card-light px-8 py-6 rounded-2xl flex flex-col items-center min-w-[160px] border-b-2 border-brand"><span class="text-3xl font-black text-brand">${activeProjects}</span><span class="text-xs text-slate-500 font-semibold mt-1">Startaplar</span></div>
                </div>
                
                <a href="/app" class="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg flex items-center gap-2">
                    Platformaga kirish <i class="fas fa-arrow-right text-sm"></i>
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
// 2-XONA: HAQIQIY ILOVA (Dashboard Style)
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
            <title>ADU Hub | Dashboard</title>
            ${headElements}
        </head>
        <body class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div class="header-glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light p-8 rounded-2xl max-w-sm w-full text-center shadow-xl">
                    <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><i class="fas fa-lock text-brand text-2xl"></i></div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-6 text-sm">Korporativ pochta orqali tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili (@adu.uz)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-3 text-slate-900 dark:text-white focus:outline-none focus:border-brand transition text-sm">
                    <input id="loginCode" type="password" placeholder="Maxfiy kod (OTP)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-6 text-slate-900 dark:text-white focus:outline-none focus:border-brand transition text-sm">
                    
                    <button onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-semibold py-3 rounded-lg transition shadow-sm">Tasdiqlash</button>
                    <p id="authErrorMsg" class="text-red-500 text-sm mt-3 hidden font-medium">Ma'lumot xato!</p>
                </div>
            </div>

            <aside class="w-64 card-light h-full flex flex-col hidden md:flex z-20 border-r border-slate-200 dark:border-slate-800 rounded-none bg-white dark:bg-slate-900">
                <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                    <img src="${LOGO_URL}" alt="Logo" class="w-8 h-8 object-contain">
                    <h1 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">ADU Hub</h1>
                </div>
                
                <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Asosiy</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-medium active-tab bg-blue-50 dark:bg-blue-900/20 text-brand"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Bozor</p>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                </nav>
                
                <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button class="install-btn w-full mb-2 bg-brand text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:bg-brandhover"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                    <button onclick="toggleTheme()" class="w-full flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg font-medium transition"><i class="fas fa-moon dark:hidden w-5 text-center"></i><i class="fas fa-sun hidden dark:block w-5 text-center"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10">
                
                <div class="md:hidden flex justify-between items-center mb-6 card-light p-4 rounded-xl">
                    <div class="flex items-center gap-2">
                        <img src="${LOGO_URL}" class="w-8 h-8 object-contain">
                        <span class="font-bold text-slate-900 dark:text-white">ADU Hub</span>
                    </div>
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
                        <button class="install-btn text-brand font-bold text-sm">O'rnatish</button>
                    </div>
                </div>

                <div class="card-light p-2 rounded-xl mb-8 flex flex-col md:flex-row gap-2 items-center sticky top-0 z-30">
                    <div class="relative w-full">
                        <i class="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400"></i>
                        <input type="text" id="searchInput" onkeyup="filterItems()" placeholder="Qidirish..." class="w-full bg-transparent border-none pl-10 pr-4 py-2.5 text-slate-900 dark:text-white focus:outline-none text-sm">
                    </div>
                    <div class="w-full md:w-[1px] md:h-6 bg-slate-200 dark:bg-slate-700 hidden md:block"></div>
                    <select id="categoryFilter" onchange="filterItems()" class="w-full md:w-auto bg-slate-50 dark:bg-slate-800 rounded-lg px-4 py-2 text-slate-700 dark:text-slate-300 text-sm font-medium focus:outline-none cursor-pointer border border-transparent">
                        <option value="all">Barcha toifalar</option>
                        <option value="dasturchi">Dasturchi</option>
                        <option value="dizayner">Dizayner</option>
                        <option value="sotuv">Sotuv</option>
                        <option value="smm">Marketing</option>
                    </select>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">A'zolar</p><h3 class="text-3xl font-bold text-slate-900 dark:text-white">${totalUsers}</h3></div>
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">Jamoa bosqichi</p><h3 class="text-3xl font-bold text-amber-500">${teamBuilding}</h3></div>
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">MVP bosqichi</p><h3 class="text-3xl font-bold text-purple-500">${mvpStage}</h3></div>
                        <div class="card-light p-5 rounded-xl border-l-4 border-brand"><p class="text-slate-500 text-xs font-medium uppercase mb-1">Ishga tushgan</p><h3 class="text-3xl font-bold text-brand">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="projectsGrid">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="filterable-item hover-card card-light p-5 rounded-xl cursor-pointer flex flex-col justify-between" data-title="${p.title.toLowerCase()}" data-category="all" onclick="openModal('${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')">
                                <div>
                                    <div class="flex justify-between items-start mb-3">
                                        <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">${p.title}</h3>
                                        <span class="text-[10px] font-semibold px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-brand uppercase">Loyiha</span>
                                    </div>
                                    <p class="text-slate-600 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">${p.goal}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${resumes.map(r => {
                            let cat = "dasturchi"; let color="blue";
                            let lower = r.skills.toLowerCase();
                            if(lower.includes("dizayn") || lower.includes("figma")) {cat = "dizayner"; color="purple";}
                            if(lower.includes("sotuv") || lower.includes("menejer")) {cat = "sotuv"; color="amber";}
                            if(lower.includes("smm") || lower.includes("marketing")) {cat = "smm"; color="red";}
                            return `
                        <div class="filterable-item hover-card card-light p-5 rounded-xl" data-title="${r.skills.toLowerCase()}" data-category="${cat}">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-sm font-bold text-slate-900 dark:text-white"><i class="fas fa-user-circle text-slate-400 mr-2 text-lg"></i> @${r.author.username || 'Talaba'}</h3>
                                <span class="text-[10px] uppercase font-semibold text-${color}-600 dark:text-${color}-400 bg-${color}-50 dark:bg-${color}-900/20 px-2 py-1 rounded">${cat}</span>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${r.skills}</p>
                        </div>`}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white tracking-tight">Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${problems.map(pr => `
                        <div class="filterable-item hover-card card-light p-5 rounded-xl" data-title="${pr.description.toLowerCase()}" data-category="all">
                            <p class="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed mb-4">"${pr.description}"</p>
                            <span class="text-[10px] text-slate-400 font-semibold uppercase">Anonim yozildi</span>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-light fixed bottom-0 left-0 w-full z-50 border-t border-slate-200 dark:border-slate-800 pb-safe rounded-t-2xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-brand active-tab transition"><i class="fas fa-chart-pie text-lg mb-1"></i><span class="text-[10px] font-medium">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400 transition"><i class="fas fa-rocket text-lg mb-1"></i><span class="text-[10px] font-medium">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400 transition"><i class="fas fa-user-astronaut text-lg mb-1"></i><span class="text-[10px] font-medium">Kadr</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400 transition"><i class="fas fa-fire text-lg mb-1"></i><span class="text-[10px] font-medium">Muammo</span></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/50 dark:bg-slate-900/80 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-xl rounded-2xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-xl md:text-2xl font-bold mb-6 pr-8 text-slate-900 dark:text-white">Sarlavha</h2>
                    
                    <div class="space-y-4 mb-8">
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Muammo Sababi</h4>
                            <p id="modalCause" class="text-slate-700 dark:text-slate-300 text-sm">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-slate-700 dark:text-slate-300 text-sm">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Manfaatdorlar</h4>
                            <p id="modalBenefits" class="text-slate-700 dark:text-slate-300 text-sm">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="bg-brand hover:bg-brandhover w-full flex items-center justify-center gap-2 py-3.5 text-white font-semibold rounded-lg transition shadow-sm">
                        <i class="fab fa-telegram-plane"></i> Jamoaga qo'shilish
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
                    } else { document.getElementById('authErrorMsg').classList.remove('hidden'); }
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
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); el.classList.add('text-slate-600', 'dark:text-slate-400'); });
                    if(document.querySelector('.mobile-nav-item')) document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-brand'); el.classList.add('text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-brand'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); btn.classList.remove('text-slate-600', 'dark:text-slate-400'); }
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
    } catch (error) { console.error(error); res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
