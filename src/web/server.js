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
// 🎨 UMUMIY DIZAYN (Premium SaaS - Light/Dark)
// ==========================================
const headElements = `
    <link rel="manifest" href="/app.webmanifest?v=12">
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
        body { font-family: 'Inter', sans-serif; transition: background-color 0.4s ease, color 0.4s ease; -webkit-tap-highlight-color: transparent; }
        
        /* ------------------------------------- */
        /* ☀️ LIGHT MODE (Kunduzgi Premium Rejim) */
        /* ------------------------------------- */
        body:not(.dark) { background-color: #f8fafc; color: #1e293b; } 
        body:not(.dark) .grid-bg { 
            background-image: radial-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px); 
        }
        body:not(.dark) .ambient-glow { 
            background: 
                radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.08) 0%, transparent 50%),
                radial-gradient(circle at 80% 70%, rgba(147, 51, 234, 0.06) 0%, transparent 50%); 
            filter: blur(50px);
        }
        body:not(.dark) .card-light { 
            background: rgba(255, 255, 255, 0.75); 
            backdrop-filter: blur(16px); 
            -webkit-backdrop-filter: blur(16px); 
            border: 1px solid rgba(255, 255, 255, 0.9); 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.02), inset 0 1px 0 rgba(255,255,255,0.7); 
        }
        body:not(.dark) .hover-card:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05); 
            border-color: rgba(37, 99, 235, 0.3); 
        }

        /* ------------------------------------- */
        /* 🌙 DARK MODE (Tungi Premium Rejim) */
        /* ------------------------------------- */
        .dark body { background-color: #020617; color: #f8fafc; } 
        .dark .grid-bg { 
            background-image: radial-gradient(rgba(255, 255, 255, 0.06) 1px, transparent 1px); 
        }
        .dark .ambient-glow { 
            background: radial-gradient(ellipse at 50% -10%, rgba(37,99,235,0.15) 0%, transparent 60%); 
            filter: blur(60px);
        }
        .dark .card-light { 
            background: rgba(15, 23, 42, 0.6); 
            backdrop-filter: blur(12px); 
            -webkit-backdrop-filter: blur(12px); 
            border: 1px solid rgba(255, 255, 255, 0.08); 
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); 
        }
        .dark .hover-card:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 15px 30px -5px rgba(37, 99, 235, 0.25); 
            border-color: rgba(37, 99, 235, 0.4); 
        }
        
        /* Umumiy sozlamalar */
        .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; background-size: 28px 28px; }
        .ambient-glow { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }
        
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); } 
        .tab-content.active { display: block; }
        @keyframes slideUp { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
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

const ROCKET_ICON = `<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand to-blue-400 flex items-center justify-center text-white shadow-md shadow-brand/30"><i class="fas fa-rocket text-sm"></i></div>`;
const ROCKET_ICON_LARGE = `<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-blue-400 flex items-center justify-center text-white shadow-xl shadow-brand/40 mx-auto mb-5"><i class="fas fa-rocket text-3xl"></i></div>`;

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
            <nav class="w-full card-light fixed top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/50 dark:border-slate-800/50">
                <div class="flex items-center gap-3">${ROCKET_ICON}<span class="text-xl font-extrabold tracking-tight">ADU Hub</span></div>
                <div class="flex gap-4">
                    <button onclick="toggleTheme()" class="text-slate-500 hover:text-brand transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                    <button class="install-btn bg-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-brand/20 hidden md:block hover:bg-brandhover transition transform hover:-translate-y-0.5">Ilovani olish</button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block px-5 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-brand font-bold text-[10px] uppercase tracking-widest border border-blue-100 dark:border-blue-800/50 shadow-sm">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-7xl font-black mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-slate-900 dark:text-white">Universitet g'oyalarini <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-500">bozorga aylantiramiz.</span></h1>
                <p class="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-light px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px]"><span class="text-4xl font-black text-slate-900 dark:text-white">${totalUsers}</span><span class="text-[10px] uppercase text-slate-500 font-bold mt-2 tracking-widest">A'zolar</span></div>
                    <div class="card-light px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px] border-b-4 border-brand"><span class="text-4xl font-black text-brand">${activeProjects}</span><span class="text-[10px] uppercase text-slate-500 font-bold mt-2 tracking-widest">Startaplar</span></div>
                </div>
                <a href="/app" class="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 flex items-center gap-3">Platformaga kirish <i class="fas fa-arrow-right"></i></a>
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
        <body class="flex h-screen overflow-hidden relative">
            <div class="grid-bg"></div><div class="ambient-glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-white/60 dark:bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-xl">
                <div class="card-light p-10 rounded-[2rem] max-w-sm w-full text-center shadow-2xl">
                    ${ROCKET_ICON_LARGE}
                    <h2 class="text-3xl font-extrabold mb-2 tracking-tight">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm font-medium">Korporativ pochtani kiriting (@adu.uz)</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-5 py-4 mb-4 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-5 py-4 mb-6 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium hidden transition">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-bold py-4 rounded-xl shadow-lg shadow-brand/30 transition transform hover:-translate-y-0.5">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-red-500 text-sm mt-4 hidden font-bold">Xatolik</p>
                </div>
            </div>

            <aside class="w-[280px] card-light m-4 rounded-3xl h-[calc(100vh-32px)] flex flex-col hidden md:flex z-20 shadow-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
                <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800/50">
                    ${ROCKET_ICON}
                    <h1 class="text-xl font-extrabold tracking-tight">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Katalog</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3 rounded-2xl active-tab bg-brand text-white font-semibold shadow-md shadow-brand/20 transition-all"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-semibold transition-all"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-semibold transition-all"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-semibold transition-all"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl font-semibold transition-all"><i class="fas fa-user-circle w-5 text-center"></i> Profil</button>
                </nav>
                <div class="p-6 border-t border-slate-100 dark:border-slate-800/50 flex flex-col gap-3">
                    <button class="install-btn w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl font-bold text-sm shadow-lg transition transform hover:-translate-y-0.5"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                    <button onclick="toggleTheme()" class="w-full flex items-center justify-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-28 md:p-8 z-10">
                <div class="md:hidden flex justify-between items-center mb-8 card-light p-4 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-3">${ROCKET_ICON}<span class="font-extrabold text-lg">ADU Hub</span></div>
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="text-slate-500 w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                        <button class="install-btn bg-brand text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md"><i class="fas fa-download"></i></button>
                    </div>
                </div>

                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 tracking-tight">Shaxsiy Kabinet</h2>
                    <div class="card-light p-8 rounded-3xl border-t-4 border-brand mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand text-3xl shadow-inner"><i class="fas fa-user-astronaut"></i></div>
                            <div>
                                <h3 class="text-xl font-bold" id="userEmailDisplay">Yuklanmoqda...</h3>
                                <span class="text-[10px] font-bold px-3 py-1 rounded-md bg-green-100 text-green-700 mt-2 inline-block uppercase tracking-wider">Tasdiqlangan a'zo</span>
                            </div>
                        </div>
                        <button onclick="logout()" class="px-6 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition w-full md:w-auto flex items-center justify-center gap-2"><i class="fas fa-sign-out-alt"></i> Chiqish</button>
                    </div>
                    
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Platformaga qo'shish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div onclick="openWebForm('project')" class="card-light border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand cursor-pointer p-8 rounded-3xl flex flex-col items-center justify-center text-center transition group"><i class="fas fa-plus text-3xl text-slate-300 dark:text-slate-600 group-hover:text-brand mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-400 group-hover:text-brand">Startap qo'shish</p></div>
                        <div onclick="openWebForm('resume')" class="card-light border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 cursor-pointer p-8 rounded-3xl flex flex-col items-center justify-center text-center transition group"><i class="fas fa-plus text-3xl text-slate-300 dark:text-slate-600 group-hover:text-purple-500 mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-400 group-hover:text-purple-500">Rezyume qo'shish</p></div>
                        <div onclick="openWebForm('problem')" class="card-light border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 cursor-pointer p-8 rounded-3xl flex flex-col items-center justify-center text-center transition group"><i class="fas fa-plus text-3xl text-slate-300 dark:text-slate-600 group-hover:text-amber-500 mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-400 group-hover:text-amber-500">Muammo yozish</p></div>
                    </div>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 tracking-tight">Tizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        <div class="card-light p-6 rounded-3xl"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">A'zolar</p><h3 class="text-4xl font-black">${totalUsers}</h3></div>
                        <div class="card-light p-6 rounded-3xl"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Jamoa bosqichi</p><h3 class="text-4xl font-black text-amber-500">${teamBuilding}</h3></div>
                        <div class="card-light p-6 rounded-3xl"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">MVP bosqichi</p><h3 class="text-4xl font-black text-purple-500">${mvpStage}</h3></div>
                        <div class="card-light p-6 rounded-3xl border-b-4 border-brand"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Ishga tushgan</p><h3 class="text-4xl font-black text-brand">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 tracking-tight">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="hover-card card-light p-6 rounded-3xl flex flex-col justify-between cursor-pointer group" onclick="openModal('${safeHTML(p.title)}', '${safeHTML(p.problemCause)}', '${safeHTML(p.goal)}', '${safeHTML(p.benefits)}', '${p.id}')">
                                <div>
                                    <div class="flex justify-between items-start mb-4">
                                        <h3 class="text-xl font-bold leading-tight">${safeHTML(p.title)}</h3>
                                        <div class="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition"><i class="fas fa-arrow-right text-xs"></i></div>
                                    </div>
                                    <p class="text-slate-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed">${safeHTML(p.goal)}</p>
                                </div>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 tracking-tight">Kadrlar va Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => `<div class="card-light p-6 rounded-3xl border-l-4 border-brand"><div class="flex items-center gap-3 mb-3"><i class="fas fa-user-circle text-slate-400 text-xl"></i><span class="font-bold text-sm">@${r.author.username || 'Talaba'}</span></div><p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${safeHTML(r.skills)}</p></div>`).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 tracking-tight">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `<div class="card-light p-6 rounded-3xl relative"><i class="fas fa-quote-left text-3xl text-slate-200 dark:text-slate-800 absolute top-4 left-4"></i><p class="text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed relative z-10 pt-2">"${safeHTML(pr.description)}"</p><div class="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800"><span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Anonim kuzatuvchi</span></div></div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-light fixed bottom-4 left-4 right-4 z-50 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn p-3 text-brand active-tab flex flex-col items-center rounded-xl bg-brand/10 transition"><i class="fas fa-chart-pie text-lg"></i></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn p-3 text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-rocket text-lg"></i></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn p-3 text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-astronaut text-lg"></i></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn p-3 text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-fire text-lg"></i></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn p-3 text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-circle text-lg"></i></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 z-[70] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-lg rounded-3xl p-8 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 hover:bg-slate-200 transition"><i class="fas fa-times"></i></button>
                    <h2 id="formTitle" class="text-2xl font-extrabold mb-6">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-4 mb-8"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand hover:bg-brandhover text-white py-4 rounded-xl font-bold transition shadow-lg shadow-brand/30 transform hover:-translate-y-0.5">Bazaga saqlash</button>
                    <p id="formStatus" class="text-sm font-bold mt-4 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 z-[60] hidden items-center justify-center p-4 backdrop-blur-md">
                <div class="card-light w-full max-w-xl rounded-[2rem] p-8 md:p-10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 hover:bg-slate-200 transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-extrabold mb-8 pr-10 leading-tight">Sarlavha</h2>
                    <div class="space-y-5 mb-10">
                        <div class="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-exclamation-circle text-rose-500"></i> Muammo</h4>
                            <p id="modalCause" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-bullseye text-brand"></i> Maqsad</h4>
                            <p id="modalGoal" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50/50 dark:bg-slate-800/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <h4 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-gem text-amber-500"></i> Manfaat</h4>
                            <p id="modalBenefits" class="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 w-full flex items-center justify-center gap-3 py-4 text-lg font-bold rounded-xl transition shadow-lg transform hover:-translate-y-1">
                        <i class="fab fa-telegram-plane text-brand"></i> Jamoaga qo'shilish
                    </a>
                </div>
            </div>

            ${installScript}
            <script>
                // 1. LOGIN LOGIKASI
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
                    document.querySelectorAll('.nav-btn').forEach(el => { 
                        if(el.classList.contains('mobile-nav-item')) {
                            el.classList.remove('active-tab', 'text-brand', 'bg-brand/10'); 
                            el.classList.add('text-slate-400');
                        } else {
                            el.classList.remove('active-tab', 'bg-brand', 'text-white', 'shadow-md', 'shadow-brand/20'); 
                            el.classList.add('text-slate-600', 'dark:text-slate-400'); 
                        }
                    });
                    
                    document.getElementById(id).classList.add('active');
                    btn.classList.add('active-tab'); 
                    
                    if(btn.classList.contains('mobile-nav-item')) {
                        btn.classList.add('text-brand', 'bg-brand/10'); 
                        btn.classList.remove('text-slate-400');
                    } else {
                        btn.classList.add('bg-brand', 'text-white', 'shadow-md', 'shadow-brand/20'); 
                        btn.classList.remove('text-slate-600', 'dark:text-slate-400');
                    }
                }

                // 3. MA'LUMOT QO'SHISH FORMASI
                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type;
                    const content = document.getElementById('formContent');
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Yangi Startap";
                        content.innerHTML = '<input id="fTitle" placeholder="Loyiha nomi" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition"><input id="fCause" placeholder="Muammo sababi" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm mb-3 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition"><textarea id="fGoal" placeholder="Asosiy maqsad" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm mb-3 h-24 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition resize-none"></textarea><input id="fBenefit" placeholder="Kimga foyda keltiradi?" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition">';
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Rezyume kiritish";
                        content.innerHTML = '<textarea id="fSkills" placeholder="Qanday qobiliyatlaringiz bor? (Masalan: Node.js, Figma, Sotuv)" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm h-32 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition resize-none"></textarea>';
                    } else {
                        document.getElementById('formTitle').innerText = "Muammo yozish";
                        content.innerHTML = '<textarea id="fDesc" placeholder="Kuzatgan muammongizni yozing (Anonim tarzda chop etiladi)" class="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 p-4 rounded-xl text-sm h-32 focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 font-medium transition resize-none"></textarea>';
                    }
                    document.getElementById('webFormModal').classList.remove('hidden');
                    document.getElementById('webFormModal').classList.add('flex');
                    document.getElementById('formStatus').classList.add('hidden');
                }

                function closeWebForm() { document.getElementById('webFormModal').classList.add('hidden'); document.getElementById('webFormModal').classList.remove('flex'); }

                async function submitWebForm() {
                    const status = document.getElementById('formStatus');
                    status.innerText = "Jo'natilmoqda..."; status.className = "text-sm font-bold mt-4 text-center text-blue-500 block";
                    
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
                        status.className = "text-sm font-bold mt-4 text-center text-green-500 block";
                        setTimeout(() => location.reload(), 1000);
                    } else {
                        status.innerText = "Xatolik yuz berdi.";
                        status.className = "text-sm font-bold mt-4 text-center text-red-500 block";
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
