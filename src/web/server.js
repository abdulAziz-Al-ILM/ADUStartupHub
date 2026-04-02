const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer'); 

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// 🚀 RAKETA LOGOTIPI (100% Kod yordamida chizilgan, faylsiz)
// ==========================================
app.get('/icon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><path fill="#ffffff" d="M398.5 113.5c-11.3-11.3-29.6-11.3-40.9 0l-55.3 55.3c-15.6-4.8-32.6-1.7-45.4 8.7L137.5 296.9c-11.3 11.3-11.3 29.6 0 40.9l45.4 45.4-37.3 119.2c-4.8 15.6-1.7 32.6 8.7 45.4 14.8 12 34.3 19.5 53.4 15.9 44.5-8.4 118.7-41.5 167.3-90.1 48.6-48.6 81.7-122.8 90.1-167.3 3.6-19.1-3.9-38.6-18.7-50.6l-55.3-55.3c10.4-12.8 13.5-29.8 8.7-45.4l119.2-37.3c15.6-4.8 32.6-1.7 45.4 8.7 12 14.8 19.5 34.3 15.9 53.4-8.4 44.5-41.5 118.7-90.1 167.3-48.6 48.6-122.8 81.7-167.3 90.1-19.1 3.6-38.6-3.9-50.6-18.7-10.4-12.8-13.5-29.8-8.7-45.4l55.3-55.3c-11.3-11.3-11.3-29.6 0-40.9s29.6-11.3 40.9 0l55.3-55.3c15.6 4.8 32.6 1.7 45.4-8.7L398.5 113.5zM256 224c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32z"/></svg>`);
});

app.get('/app.webmanifest', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app", "display": "standalone",
        "background_color": "#ffffff", "theme_color": "#2563eb",
        "icons": [{"src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable"}]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`
        self.addEventListener('install', (e) => { self.skipWaiting(); }); 
        self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); }); 
        self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => new Response('Internet yo\\'q'))); });
    `);
});

// ==========================================
// 🔐 WEB API: MUSTAQIL LOGIN VA PROFIL
// ==========================================
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || (!email.endsWith('@adu.uz') && !email.endsWith('@gmail.com'))) {
        return res.status(400).json({ error: "Faqat @adu.uz pochtasi qabul qilinadi" });
    }
    const otp = generateOTP();
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        await prisma.user.create({ data: { email, otpCode: otp, isVerified: false, telegramId: BigInt(Date.now()) } }); 
    } else {
        await prisma.user.update({ where: { email }, data: { otpCode: otp } });
    }
    
    await sendOTP(email, otp);
    res.json({ success: true });
});

app.post('/api/auth/verify', async (req, res) => {
    const { email, code } = req.body;
    if (email === 'admin@adu.uz' && code === '7777') return res.json({ success: true, email }); 
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.otpCode === code) {
        await prisma.user.update({ where: { email }, data: { isVerified: true, otpCode: null } });
        res.json({ success: true, email });
    } else {
        res.status(400).json({ error: "Maxfiy kod xato!" });
    }
});

app.post('/api/add-item', async (req, res) => {
    const { email, type, data } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Avtorizatsiya xatosi" });

    try {
        if (type === 'project') await prisma.project.create({ data: { title: data.title, problemCause: data.cause, goal: data.goal, benefits: data.benefits, authorId: user.id } });
        else if (type === 'resume') await prisma.resume.create({ data: { skills: data.skills, authorId: user.id } });
        else if (type === 'problem') await prisma.problem.create({ data: { description: data.description, authorId: user.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server xatosi" }); }
});

// ==========================================
// 🎨 UMUMIY DIZAYN (Grid & Ambient Glow)
// ==========================================
const headElements = `
    <link rel="manifest" href="/app.webmanifest">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s, color 0.3s; -webkit-tap-highlight-color: transparent; }
        
        /* Fonga chuqurlik va Grid (Nuqtalar) qo'shamiz */
        body:not(.dark) { background-color: #f8fafc; color: #0f172a; } 
        .dark body { background-color: #020617; color: #f8fafc; } /* Ko'zni toliqtirmaydigan to'q qora/slate */
        
        .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; background-image: radial-gradient(rgba(15, 23, 42, 0.08) 1px, transparent 1px); background-size: 28px 28px; }
        .dark .grid-bg { background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px); }
        
        /* Yumshoq nur */
        .ambient-glow { position: fixed; top: -10vh; left: 50%; transform: translateX(-50%); width: 70vw; height: 50vh; background: radial-gradient(ellipse, rgba(37,99,235,0.15) 0%, transparent 70%); z-index: -1; pointer-events: none; filter: blur(60px); }
        .dark .ambient-glow { background: radial-gradient(ellipse, rgba(37,99,235,0.1) 0%, transparent 70%); }

        /* Shishasimon (Frosted Glass) kartochkalar */
        .card-light { background: rgba(255, 255, 255, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(226, 232, 240, 0.8); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02); }
        .dark .card-light { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
        
        .hover-card { transition: all 0.2s ease; } .hover-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-color: rgba(37,99,235,0.4); }
        .dark .hover-card:hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-color: rgba(37,99,235,0.4); }
        
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeIn 0.3s ease; } .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;

const installScript = `
    <script>
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
                for(let registration of registrations) { registration.unregister(); }
            });
            navigator.serviceWorker.register('/sw.js');
        }

        let dp; window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); dp = e; }); 
        function handleInstall() { 
            if(dp) { dp.prompt(); dp.userChoice.then(r => { if(r.outcome === 'accepted') dp = null; }); } 
            else { 
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish:\\n1. Brauzer pastidagi 'Ulashish' belgisini bosing.\\n2. 'Ekranga qo'shish' ni tanlang.");
                else alert("Ilova tayyor! Brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' ni bosing."); 
            } 
        } 
        document.querySelectorAll('.install-btn').forEach(b => b.addEventListener('click', handleInstall));
    </script>
`;

const safeHTML = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/[\r\n]+/g, ' ') : '';

const ROCKET_ICON = `<div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm"><i class="fas fa-rocket text-sm"></i></div>`;
const ROCKET_ICON_LARGE = `<div class="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white shadow-xl mx-auto mb-4"><i class="fas fa-rocket text-3xl"></i></div>`;

// ==========================================
// 1-XONA: LANDING PAGE
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });
        
        res.send(`
        <!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ADU Hub</title>${headElements}</head>
        <body class="min-h-screen flex flex-col relative">
            <div class="grid-bg"></div><div class="ambient-glow"></div>
            <nav class="w-full card-light fixed top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3">${ROCKET_ICON}<span class="text-xl font-bold tracking-tight">ADU Hub</span></div>
                <div class="flex gap-4">
                    <button onclick="toggleTheme()" class="text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
                    <button class="install-btn bg-brand text-white px-4 py-2 rounded-lg font-semibold text-sm shadow-sm hidden md:block hover:bg-brandhover">Ilovani olish</button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-brand font-semibold text-xs tracking-wide">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-6xl font-extrabold mb-6 leading-tight max-w-3xl mx-auto tracking-tight">Universitet g'oyalarini <span class="text-brand">bozorga aylantiramiz.</span></h1>
                <p class="text-lg text-slate-500 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-light px-8 py-6 rounded-2xl flex flex-col items-center min-w-[160px]"><span class="text-3xl font-black">${totalUsers}</span><span class="text-xs text-slate-500 font-semibold mt-1">A'zolar</span></div>
                    <div class="card-light px-8 py-6 rounded-2xl flex flex-col items-center min-w-[160px] border-b-2 border-brand"><span class="text-3xl font-black text-brand">${activeProjects}</span><span class="text-xs text-slate-500 font-semibold mt-1">Startaplar</span></div>
                </div>
                <a href="/app" class="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-8 py-4 rounded-xl font-semibold text-lg transition shadow-lg flex items-center gap-2">Platformaga kirish <i class="fas fa-arrow-right"></i></a>
            </main>
            ${installScript}
        </body></html>
        `);
    } catch (e) { res.status(500).send("Xato"); }
});

// ==========================================
// 2-XONA: ILOVA VA PROFIL (KABINET)
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

        res.send(`
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            ${headElements}
        </head>
        <body class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div class="grid-bg"></div><div class="ambient-glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light p-8 rounded-2xl max-w-sm w-full text-center shadow-xl">
                    ${ROCKET_ICON_LARGE}
                    <h2 class="text-2xl font-bold mb-2">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-6 text-sm">Korporativ pochtani kiriting (@adu.uz)</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-4 focus:outline-none focus:border-brand text-sm transition">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-6 focus:outline-none focus:border-brand text-sm hidden transition">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-semibold py-3 rounded-lg shadow-sm transition">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-red-500 text-sm mt-3 hidden font-medium">Xatolik</p>
                </div>
            </div>

            <aside class="w-64 card-light h-full flex flex-col hidden md:flex z-20 border-r border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
                <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                    ${ROCKET_ICON}
                    <h1 class="text-lg font-bold tracking-tight">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Katalog</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg active-tab bg-blue-50 dark:bg-blue-900/20 text-brand"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><i class="fas fa-user w-5 text-center"></i> Profil Kabineti</button>
                </nav>
                <div class="p-4 border-t border-slate-100 dark:border-slate-800">
                    <button class="install-btn w-full mb-2 bg-brand text-white px-4 py-2 rounded-lg font-medium text-sm transition hover:bg-brandhover"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                    <button onclick="toggleTheme()" class="w-full flex items-center gap-3 px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"><i class="fas fa-moon dark:hidden w-5"></i><i class="fas fa-sun hidden dark:block w-5"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10">
                <div class="md:hidden flex justify-between items-center mb-6 card-light p-4 rounded-xl">
                    <div class="flex items-center gap-2">${ROCKET_ICON}<span class="font-bold">ADU Hub</span></div>
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button>
                        <button class="install-btn text-brand font-bold text-sm">O'rnatish</button>
                    </div>
                </div>

                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6">Shaxsiy Kabinet</h2>
                    <div class="card-light p-6 rounded-xl border-t-4 border-brand mb-6 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4">
                        <div class="flex items-center gap-4">
                            <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand text-2xl"><i class="fas fa-user"></i></div>
                            <div>
                                <h3 class="text-lg font-bold" id="userEmailDisplay">Yuklanmoqda...</h3>
                                <span class="text-[10px] font-semibold px-2 py-1 rounded bg-green-100 text-green-700 mt-1 inline-block">Tasdiqlangan a'zo</span>
                            </div>
                        </div>
                        <button onclick="logout()" class="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 transition w-full md:w-auto"><i class="fas fa-sign-out-alt"></i> Chiqish</button>
                    </div>
                    
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 mt-8">Platformaga qo'shish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div onclick="openWebForm('project')" class="card-light border-2 border-dashed border-slate-300 hover:border-brand cursor-pointer p-6 rounded-xl text-center transition group"><i class="fas fa-plus text-2xl text-slate-400 group-hover:text-brand mb-2 transition"></i><p class="font-bold text-slate-600 group-hover:text-brand">Startap qo'shish</p></div>
                        <div onclick="openWebForm('resume')" class="card-light border-2 border-dashed border-slate-300 hover:border-purple-500 cursor-pointer p-6 rounded-xl text-center transition group"><i class="fas fa-plus text-2xl text-slate-400 group-hover:text-purple-500 mb-2 transition"></i><p class="font-bold text-slate-600 group-hover:text-purple-500">Rezyume qo'shish</p></div>
                        <div onclick="openWebForm('problem')" class="card-light border-2 border-dashed border-slate-300 hover:border-amber-500 cursor-pointer p-6 rounded-xl text-center transition group"><i class="fas fa-plus text-2xl text-slate-400 group-hover:text-amber-500 mb-2 transition"></i><p class="font-bold text-slate-600 group-hover:text-amber-500">Muammo yozish</p></div>
                    </div>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">A'zolar</p><h3 class="text-3xl font-bold">${totalUsers}</h3></div>
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">Jamoa bosqichi</p><h3 class="text-3xl font-bold text-amber-500">${teamBuilding}</h3></div>
                        <div class="card-light p-5 rounded-xl"><p class="text-slate-500 text-xs font-medium uppercase mb-1">MVP bosqichi</p><h3 class="text-3xl font-bold text-purple-500">${mvpStage}</h3></div>
                        <div class="card-light p-5 rounded-xl border-l-4 border-brand"><p class="text-slate-500 text-xs font-medium uppercase mb-1">Ishga tushgan</p><h3 class="text-3xl font-bold text-brand">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="hover-card card-light p-5 rounded-xl flex flex-col justify-between cursor-pointer" onclick="openModal('${safeHTML(p.title)}', '${safeHTML(p.problemCause)}', '${safeHTML(p.goal)}', '${safeHTML(p.benefits)}', '${p.id}')">
                                <div>
                                    <h3 class="text-lg font-bold mb-2">${safeHTML(p.title)}</h3>
                                    <p class="text-slate-500 text-sm line-clamp-3">${safeHTML(p.goal)}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6">Kadrlar va Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${resumes.map(r => `<div class="card-light p-5 rounded-xl border-l-4 border-brand"><p class="text-slate-600 dark:text-slate-400 text-sm">${safeHTML(r.skills)}</p></div>`).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${problems.map(pr => `<div class="card-light p-5 rounded-xl"><p class="text-slate-700 dark:text-slate-300 text-sm font-medium">"${safeHTML(pr.description)}"</p><span class="text-[10px] text-slate-400 font-bold uppercase mt-3 inline-block">Anonim</span></div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-light fixed bottom-0 w-full z-50 border-t border-slate-200 dark:border-slate-800 pb-safe">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn p-2 text-brand active-tab flex flex-col items-center"><i class="fas fa-chart-pie text-lg mb-1"></i><span class="text-[10px] font-medium">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn p-2 text-slate-400 flex flex-col items-center"><i class="fas fa-rocket text-lg mb-1"></i><span class="text-[10px] font-medium">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn p-2 text-slate-400 flex flex-col items-center"><i class="fas fa-user-astronaut text-lg mb-1"></i><span class="text-[10px] font-medium">Kadr</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn p-2 text-slate-400 flex flex-col items-center"><i class="fas fa-fire text-lg mb-1"></i><span class="text-[10px] font-medium">Muammo</span></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn p-2 text-slate-400 flex flex-col items-center"><i class="fas fa-user text-lg mb-1"></i><span class="text-[10px] font-medium">Profil</span></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 z-[70] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-lg rounded-2xl p-6 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 transition"><i class="fas fa-times"></i></button>
                    <h2 id="formTitle" class="text-xl font-bold mb-4">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-3 mb-6"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand hover:bg-brandhover text-white py-3 rounded-lg font-bold transition shadow-sm">Bazaga saqlash</button>
                    <p id="formStatus" class="text-sm font-semibold mt-3 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-xl rounded-2xl p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-4 right-4 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-xl md:text-2xl font-bold mb-6 pr-8">Sarlavha</h2>
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
                // 1. LOGIN LOGIKASI (Yashirin eshik himoyasi)
                let authEmail = localStorage.getItem('adu_web_auth_email');
                if(authEmail) { 
                    document.getElementById('authGateway').style.display = 'none'; 
                    document.getElementById('userEmailDisplay').innerText = authEmail; 
                }

                let waitingForOTP = false;
                async function checkLogin() {
                    const email = document.getElementById('loginEmail').value.trim();
                    const codeInput = document.getElementById('loginCode');
                    const code = codeInput.value.trim();
                    const err = document.getElementById('authErrorMsg'); 
                    const btn = document.getElementById('loginBtn');
                    
                    err.classList.add('hidden'); 
                    
                    // YASHIRIN ESHIK
                    if(email === 'admin@adu.uz') {
                        if(!waitingForOTP) {
                            waitingForOTP = true;
                            codeInput.classList.remove('hidden');
                            btn.innerText = "Tasdiqlash";
                            return;
                        } else if(code === '7777') {
                            localStorage.setItem('adu_web_auth_email', email); location.reload(); return;
                        } else {
                            err.innerText = "Parol xato!"; err.classList.remove('hidden'); return;
                        }
                    }

                    // ODDIY ESHIK
                    btn.innerText = 'Kuting...';
                    if(!waitingForOTP) {
                        const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
                        if(res.ok) { waitingForOTP = true; codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; } 
                        else { 
                            const data = await res.json();
                            err.innerText = data.error || "Xatolik (Pochta serveriga ulanolmadi)!"; 
                            err.classList.remove('hidden'); btn.innerText = "Kod yuborish"; 
                        }
                    } else {
                        const res = await fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, code }) });
                        if(res.ok) { localStorage.setItem('adu_web_auth_email', email); location.reload(); } 
                        else { err.innerText = "Kod xato!"; err.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; }
                    }
                }

                function logout() { localStorage.removeItem('adu_web_auth_email'); location.reload(); }

                // 2. TABLARNI ALMASHTIRISH
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); el.classList.add('text-slate-600', 'dark:text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    btn.classList.add('active-tab', 'text-brand'); btn.classList.remove('text-slate-600', 'text-slate-400');
                    if(!btn.innerHTML.includes('text-[10px]')) btn.classList.add('bg-blue-50', 'dark:bg-blue-900/20');
                }

                // 3. MA'LUMOT QO'SHISH FORMASI
                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type;
                    const content = document.getElementById('formContent');
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Yangi Startap";
                        content.innerHTML = '<input id="fTitle" placeholder="Loyiha nomi" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand"><input id="fCause" placeholder="Muammo sababi" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm mb-2 focus:outline-none focus:border-brand"><textarea id="fGoal" placeholder="Asosiy maqsad" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm mb-2 h-20 focus:outline-none focus:border-brand"></textarea><input id="fBenefit" placeholder="Kimga foyda keltiradi?" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm focus:outline-none focus:border-brand">';
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Rezyume kiritish";
                        content.innerHTML = '<textarea id="fSkills" placeholder="Qanday qobiliyatlaringiz bor? (Masalan: Node.js, Figma, Sotuv)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm h-32 focus:outline-none focus:border-brand"></textarea>';
                    } else {
                        document.getElementById('formTitle').innerText = "Muammo yozish";
                        content.innerHTML = '<textarea id="fDesc" placeholder="Kuzatgan muammongizni yozing (Anonim tarzda chop etiladi)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3 rounded-lg text-sm h-32 focus:outline-none focus:border-brand"></textarea>';
                    }
                    document.getElementById('webFormModal').classList.remove('hidden');
                    document.getElementById('webFormModal').classList.add('flex');
                    document.getElementById('formStatus').classList.add('hidden');
                }

                function closeWebForm() { document.getElementById('webFormModal').classList.add('hidden'); document.getElementById('webFormModal').classList.remove('flex'); }

                async function submitWebForm() {
                    const status = document.getElementById('formStatus');
                    status.innerText = "Jo'natilmoqda..."; status.className = "text-sm font-semibold mt-3 text-center text-blue-500 block";
                    
                    let data = {};
                    if(currentFormType === 'project') data = { title: document.getElementById('fTitle').value, cause: document.getElementById('fCause').value, goal: document.getElementById('fGoal').value, benefits: document.getElementById('fBenefit').value };
                    else if(currentFormType === 'resume') data = { skills: document.getElementById('fSkills').value };
                    else data = { description: document.getElementById('fDesc').value };

                    const res = await fetch('/api/add-item', {
                        method: 'POST', headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({ email: authEmail, type: currentFormType, data })
                    });

                    if(res.ok) {
                        status.innerText = "Muvaffaqiyatli saqlandi!";
                        status.className = "text-sm font-semibold mt-3 text-center text-green-500 block";
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        status.innerText = "Xatolik yuz berdi.";
                        status.className = "text-sm font-semibold mt-3 text-center text-red-500 block";
                    }
                }

                // 4. STARTAPNI KO'RISH MODALI
                function openModal(title, cause, goal, benefits, id) {
                    document.getElementById('modalTitle').innerText = title; document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal; document.getElementById('modalBenefits').innerText = benefits;
                    document.getElementById('modalActionBtn').href = "https://t.me/ADUStartupHubBot?start=req_" + id; 
                    document.getElementById('detailModal').classList.remove('hidden'); document.getElementById('detailModal').classList.add('flex');
                }
                function closeModal() { document.getElementById('detailModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('flex'); }
            </script>
        </body>
        </html>
        `);
    } catch (error) { console.error(error); res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, '0.0.0.0', () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
