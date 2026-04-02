const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer'); 

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// 🚀 RAKETA LOGOTIPI (Buzilmaydigan PWA Ikonka)
// ==========================================
app.get('/icon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    // SVG transform(scale) orqali markazga yig'ildi, chetidan qirqilmaydi
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><g transform="translate(51.2, 51.2) scale(0.8)"><path fill="#ffffff" d="M398.5 113.5c-11.3-11.3-29.6-11.3-40.9 0l-55.3 55.3c-15.6-4.8-32.6-1.7-45.4 8.7L137.5 296.9c-11.3 11.3-11.3 29.6 0 40.9l45.4 45.4-37.3 119.2c-4.8 15.6-1.7 32.6 8.7 45.4 14.8 12 34.3 19.5 53.4 15.9 44.5-8.4 118.7-41.5 167.3-90.1 48.6-48.6 81.7-122.8 90.1-167.3 3.6-19.1-3.9-38.6-18.7-50.6l-55.3-55.3c10.4-12.8 13.5-29.8 8.7-45.4l119.2-37.3c15.6-4.8 32.6-1.7 45.4 8.7 12 14.8 19.5 34.3 15.9 53.4-8.4 44.5-41.5 118.7-90.1 167.3-48.6 48.6-122.8 81.7-167.3 90.1-19.1 3.6-38.6-3.9-50.6-18.7-10.4-12.8-13.5-29.8-8.7-45.4l55.3-55.3c-11.3-11.3-11.3-29.6 0-40.9s29.6-11.3 40.9 0l55.3-55.3c15.6 4.8 32.6 1.7 45.4-8.7L398.5 113.5zM256 224c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32z"/></g></svg>`);
});

app.get('/app.webmanifest', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app", "display": "standalone",
        "background_color": "#0f172a", "theme_color": "#2563eb",
        "icons": [{"src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any"}]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { self.skipWaiting(); }); self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); }); self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => new Response('Internet yoq'))); });`);
});

// ==========================================
// 🔐 WEB API
// ==========================================
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || (!email.endsWith('@adu.uz') && !email.endsWith('@gmail.com'))) return res.status(400).json({ error: "Faqat korporativ pochta qabul qilinadi" });
    const otp = generateOTP();
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) await prisma.user.create({ data: { email, otpCode: otp, isVerified: false, telegramId: BigInt(Date.now()) } }); 
    else await prisma.user.update({ where: { email }, data: { otpCode: otp } });
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
    } else res.status(400).json({ error: "Maxfiy kod xato!" });
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
// 🎨 TOZA VA PROFESSIONAL DIZAYN (Fix)
// ==========================================
const headElements = `
    <link rel="manifest" href="/app.webmanifest?v=fixed_pro">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { 
            darkMode: 'class', 
            theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8' } } } 
        }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; -webkit-tap-highlight-color: transparent; }
        
        /* Grid Fon (Telegram/Startup vibes) */
        .bg-grid { position: fixed; inset: 0; z-index: -2; background-size: 24px 24px; background-image: radial-gradient(circle, #94a3b8 1px, transparent 1px); opacity: 0.3; }
        .dark .bg-grid { background-image: radial-gradient(circle, #334155 1px, transparent 1px); opacity: 0.5; }
        
        /* Oq oynalar muammosi to'liq yechildi */
        .card-custom { background-color: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .dark .card-custom { background-color: #1e293b; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
        
        /* Hover effekti */
        .hover-card { transition: all 0.2s ease; }
        .hover-card:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(37,99,235,0.15); border-color: #3b82f6; }
        .dark .hover-card:hover { box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4); border-color: #3b82f6; }

        @media print {
            aside, nav, .install-btn, .mobile-nav-item, button, .hover-actions { display: none !important; }
            body { background: white !important; color: black !important; padding: 0; margin: 0; }
            main { padding: 0 !important; margin: 0 !important; width: 100% !important; overflow: visible !important; }
            .card-custom { box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; background: white !important;}
            .progress-bar-bg { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important;}
        }

        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeUp 0.3s ease; } .tab-content.active { display: block; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
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

// Sohalarni aniqlash funksiyasi
function getCategory(text) {
    let lower = text.toLowerCase();
    if (lower.includes("dizayn") || lower.includes("figma") || lower.includes("ui")) return { cat: "Dizayn", color: "purple" };
    if (lower.includes("sotuv") || lower.includes("menejer") || lower.includes("biznes")) return { cat: "Biznes", color: "amber" };
    if (lower.includes("smm") || lower.includes("marketing") || lower.includes("reklama")) return { cat: "Marketing", color: "rose" };
    return { cat: "Dasturlash", color: "brand" };
}

const ROCKET_ICON = `<div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white shadow-sm"><i class="fas fa-rocket text-sm"></i></div>`;
const ROCKET_ICON_LARGE = `<div class="w-16 h-16 rounded-2xl bg-brand flex items-center justify-center text-white shadow-lg mx-auto mb-6"><i class="fas fa-rocket text-3xl"></i></div>`;

// ==========================================
// 1-XONA: LANDING PAGE
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });
        
        res.send(`
        <!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ADU Hub</title>${headElements}</head>
        <body class="min-h-screen flex flex-col relative bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div class="bg-grid"></div>
            <i class="fas fa-code absolute top-32 left-[10%] text-5xl text-slate-300 dark:text-slate-700 opacity-30 transform -rotate-12 z-[-1]"></i>
            <i class="fas fa-lightbulb absolute top-40 right-[15%] text-5xl text-amber-300 dark:text-amber-700 opacity-20 transform rotate-12 z-[-1]"></i>
            <i class="fas fa-chart-line absolute bottom-32 left-[20%] text-6xl text-brand opacity-10 transform rotate-6 z-[-1]"></i>
            <i class="fas fa-rocket absolute bottom-40 right-[10%] text-6xl text-purple-300 dark:text-purple-900 opacity-20 transform -rotate-45 z-[-1]"></i>

            <nav class="w-full card-custom fixed top-0 z-50 px-6 py-4 flex justify-between items-center rounded-none border-t-0 border-l-0 border-r-0">
                <div class="flex items-center gap-3">${ROCKET_ICON}<span class="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">ADU Hub</span></div>
                <div class="flex gap-4 items-center">
                    <button onclick="toggleTheme()" class="text-slate-500 hover:text-brand transition text-lg"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                    <button class="install-btn bg-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-sm hidden md:block hover:bg-brandhover transition">Ilovani olish</button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-8 inline-block px-4 py-1.5 rounded-full bg-brand/10 text-brand font-bold text-xs uppercase tracking-wider border border-brand/20">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-slate-900 dark:text-slate-100">Universitet g'oyalarini <span class="text-brand">bozorga aylantiramiz.</span></h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-custom px-10 py-6 rounded-2xl flex flex-col items-center min-w-[160px]"><span class="text-4xl font-black text-slate-900 dark:text-slate-100">${totalUsers}</span><span class="text-[11px] uppercase text-slate-500 font-bold mt-2 tracking-widest">A'zolar</span></div>
                    <div class="card-custom px-10 py-6 rounded-2xl flex flex-col items-center min-w-[160px] border-b-4 border-b-brand"><span class="text-4xl font-black text-brand">${activeProjects}</span><span class="text-[11px] uppercase text-slate-500 font-bold mt-2 tracking-widest">Startaplar</span></div>
                </div>
                <a href="/app" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md hover:-translate-y-1 flex items-center gap-3">Platformaga kirish <i class="fas fa-arrow-right"></i></a>
            </main>
            ${installScript}
        </body></html>
        `);
    } catch (e) { res.status(500).send("Xato"); }
});

// ==========================================
// 2-XONA: ILOVA VA HISOBOTLAR (Dashboard)
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

        // Tahlil uchun Iqtidorlar (Kadrlar) statistikasi
        let devCount = 0, designCount = 0, bizCount = 0, markCount = 0;
        resumes.forEach(r => {
            const cat = getCategory(r.skills).cat;
            if (cat === "Dizayn") designCount++;
            else if (cat === "Biznes") bizCount++;
            else if (cat === "Marketing") markCount++;
            else devCount++;
        });

        // Tahlil uchun Startaplar statistikasi
        let sDevCount = 0, sDesignCount = 0, sBizCount = 0, sMarkCount = 0;
        activeProjects.forEach(p => {
            const cat = getCategory(p.goal + " " + p.benefits).cat;
            if (cat === "Dizayn") sDesignCount++;
            else if (cat === "Biznes") sBizCount++;
            else if (cat === "Marketing") sMarkCount++;
            else sDevCount++;
        });

        const totalProj = activeProjects.length || 1; 
        const totalRes = resumes.length || 1;

        res.send(`
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            ${headElements}
        </head>
        <body class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
            <div class="bg-grid"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-100/90 dark:bg-slate-900/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom p-10 rounded-[2rem] max-w-sm w-full text-center shadow-xl">
                    ${ROCKET_ICON_LARGE}
                    <h2 class="text-2xl font-extrabold mb-2 text-slate-900 dark:text-slate-100 tracking-tight">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm">Korporativ pochtani tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili (@adu.uz)" class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 mb-4 focus:outline-none focus:border-brand font-medium transition text-slate-900 dark:text-slate-100">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-3.5 mb-6 focus:outline-none focus:border-brand font-medium hidden transition text-slate-900 dark:text-slate-100">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-bold py-3.5 rounded-xl shadow-md transition">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-rose-500 text-sm mt-4 hidden font-bold">Xatolik</p>
                </div>
            </div>

            <aside class="w-[280px] card-custom h-full flex flex-col hidden md:flex z-20 border-t-0 border-l-0 border-b-0 rounded-none">
                <div class="p-6 flex items-center gap-3 border-b border-slate-200 dark:border-slate-700">
                    ${ROCKET_ICON}
                    <h1 class="text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p class="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-4">Katalog</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 rounded-xl active-tab bg-brand/10 text-brand font-semibold transition-all"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-3 mt-8">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition-all"><i class="fas fa-user-circle w-5 text-center"></i> Profil</button>
                </nav>
                <div class="p-6 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3">
                    <button class="install-btn w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl font-bold text-sm transition"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                    <button onclick="toggleTheme()" class="w-full flex items-center justify-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-semibold transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-28 md:p-10 z-10">
                <div class="md:hidden flex justify-between items-center mb-8 card-custom p-4 rounded-2xl">
                    <div class="flex items-center gap-3">${ROCKET_ICON}<span class="font-bold text-lg text-slate-900 dark:text-slate-100">ADU Hub</span></div>
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="text-slate-600 dark:text-slate-400 w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                    </div>
                </div>

                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-100 tracking-tight">Shaxsiy Kabinet</h2>
                    <div class="card-custom p-8 rounded-[2rem] border-t-4 border-t-brand mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-3xl"><i class="fas fa-user-astronaut"></i></div>
                            <div>
                                <h3 class="text-xl font-bold text-slate-900 dark:text-slate-100" id="userEmailDisplay">Yuklanmoqda...</h3>
                                <span class="text-[11px] font-bold px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-2 inline-block uppercase tracking-widest border border-emerald-500/20">Tasdiqlangan</span>
                            </div>
                        </div>
                        <button onclick="logout()" class="px-6 py-3 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/30 transition w-full md:w-auto"><i class="fas fa-sign-out-alt mr-2"></i> Chiqish</button>
                    </div>
                    
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 mt-10 pl-2">Ma'lumot Qo'shish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div onclick="openWebForm('project')" class="card-custom border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand cursor-pointer p-8 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-rocket text-3xl text-slate-400 mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-300">Startap loyiha</p></div>
                        <div onclick="openWebForm('resume')" class="card-custom border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand cursor-pointer p-8 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-dna text-3xl text-slate-400 mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-300">Rezyume (Kadr)</p></div>
                        <div onclick="openWebForm('problem')" class="card-custom border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand cursor-pointer p-8 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-fire text-3xl text-slate-400 mb-3 transition"></i><p class="font-bold text-slate-600 dark:text-slate-300">Muammo yozish</p></div>
                    </div>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 class="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">Ekotizim Tahlili (Hisobot)</h2>
                        <button onclick="window.print()" class="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-bold text-sm hover:bg-brand hover:text-white transition shadow-sm"><i class="fas fa-print mr-2"></i> Chop etish</button>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-brand">
                            <p class="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2">Umumiy A'zolar</p>
                            <h3 class="text-4xl font-black text-slate-900 dark:text-slate-100">${totalUsers}</h3>
                            <p class="text-xs text-emerald-500 font-bold mt-3"><i class="fas fa-check-circle mr-1"></i> Faol a'zolar</p>
                        </div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-amber-500">
                            <p class="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2">Jami Startaplar</p>
                            <h3 class="text-4xl font-black text-slate-900 dark:text-slate-100">${activeProjects.length}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-3"><i class="fas fa-layer-group mr-1"></i> Bazadagi loyihalar</p>
                        </div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-purple-500">
                            <p class="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2">Kadrlar (Rezyume)</p>
                            <h3 class="text-4xl font-black text-slate-900 dark:text-slate-100">${resumes.length}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-3"><i class="fas fa-users mr-1"></i> Iqtidorlar bazasi</p>
                        </div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-rose-500">
                            <p class="text-slate-500 text-[11px] font-bold uppercase tracking-widest mb-2">Kashfiyotlar</p>
                            <h3 class="text-4xl font-black text-slate-900 dark:text-slate-100">${problems.length}</h3>
                            <p class="text-xs text-slate-500 font-medium mt-3"><i class="fas fa-exclamation-triangle mr-1"></i> Yechim kutayotgan</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="card-custom p-6 rounded-2xl md:col-span-1">
                            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4 flex items-center"><i class="fas fa-rocket text-brand mr-3"></i> Rivojlanish</h3>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">G'oya (Jamoa)</span><span class="font-bold text-slate-900 dark:text-slate-100">${teamBuilding} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-amber-500 h-3 rounded-full" style="width: ${(teamBuilding/totalProj*100)||0}%"></div></div>
                            </div>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Prototip (MVP)</span><span class="font-bold text-slate-900 dark:text-slate-100">${mvpStage} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-purple-500 h-3 rounded-full" style="width: ${(mvpStage/totalProj*100)||0}%"></div></div>
                            </div>
                            <div class="mb-2">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Bozorda</span><span class="font-bold text-slate-900 dark:text-slate-100">${launched} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-brand h-3 rounded-full" style="width: ${(launched/totalProj*100)||0}%"></div></div>
                            </div>
                        </div>

                        <div class="card-custom p-6 rounded-2xl md:col-span-1">
                            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4 flex items-center"><i class="fas fa-user-astronaut text-purple-500 mr-3"></i> Mutaxassislar</h3>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Dasturlash (IT)</span><span class="font-bold text-slate-900 dark:text-slate-100">${devCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-brand h-3 rounded-full" style="width: ${(devCount/totalRes*100)||0}%"></div></div>
                            </div>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Dizayn (UI/UX)</span><span class="font-bold text-slate-900 dark:text-slate-100">${designCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-purple-500 h-3 rounded-full" style="width: ${(designCount/totalRes*100)||0}%"></div></div>
                            </div>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Biznes & Sotuv</span><span class="font-bold text-slate-900 dark:text-slate-100">${bizCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-amber-500 h-3 rounded-full" style="width: ${(bizCount/totalRes*100)||0}%"></div></div>
                            </div>
                            <div class="mb-2">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Marketing & PR</span><span class="font-bold text-slate-900 dark:text-slate-100">${markCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-rose-500 h-3 rounded-full" style="width: ${(markCount/totalRes*100)||0}%"></div></div>
                            </div>
                        </div>

                        <div class="card-custom p-6 rounded-2xl md:col-span-1">
                            <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4 flex items-center"><i class="fas fa-layer-group text-rose-500 mr-3"></i> Startap sohalari</h3>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Dasturlash (IT)</span><span class="font-bold text-slate-900 dark:text-slate-100">${sDevCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-brand h-3 rounded-full" style="width: ${(sDevCount/totalProj*100)||0}%"></div></div>
                            </div>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Dizayn & Grafika</span><span class="font-bold text-slate-900 dark:text-slate-100">${sDesignCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-purple-500 h-3 rounded-full" style="width: ${(sDesignCount/totalProj*100)||0}%"></div></div>
                            </div>
                            <div class="mb-5">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Tijorat & Biznes</span><span class="font-bold text-slate-900 dark:text-slate-100">${sBizCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-amber-500 h-3 rounded-full" style="width: ${(sBizCount/totalProj*100)||0}%"></div></div>
                            </div>
                            <div class="mb-2">
                                <div class="flex justify-between text-sm mb-2"><span class="font-semibold text-slate-600 dark:text-slate-400">Marketing & Boshqa</span><span class="font-bold text-slate-900 dark:text-slate-100">${sMarkCount} ta</span></div>
                                <div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-rose-500 h-3 rounded-full" style="width: ${(sMarkCount/totalProj*100)||0}%"></div></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-100 tracking-tight">Faol Loyihalar</h2>
                    <div class="flex flex-col gap-4">
                        ${activeProjects.length > 0 ? activeProjects.map((p) => `
                            <div class="hover-card card-custom p-6 rounded-2xl cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4" onclick="openModal('${safeHTML(p.title)}', '${safeHTML(p.problemCause)}', '${safeHTML(p.goal)}', '${safeHTML(p.benefits)}', '${p.id}')">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><i class="fas fa-rocket text-xs"></i></div>
                                        <h3 class="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight">${safeHTML(p.title)}</h3>
                                    </div>
                                    <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed ml-11">${safeHTML(p.goal)}</p>
                                </div>
                                <div class="hidden md:flex w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 items-center justify-center text-slate-400 group-hover:bg-brand group-hover:border-brand group-hover:text-white transition"><i class="fas fa-arrow-right text-sm"></i></div>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-100 tracking-tight">Noyob Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${resumes.map(r => {
                            const catData = getCategory(r.skills);
                            return `
                            <div class="card-custom p-5 rounded-2xl border-l-4 border-l-${catData.color}-500 hover-card">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><i class="fas fa-user text-xs"></i></div>
                                        <span class="font-bold text-slate-900 dark:text-slate-100 text-sm">@${r.author.username || 'yashirin'}</span>
                                    </div>
                                    <span class="text-[10px] uppercase tracking-widest text-${catData.color}-600 dark:text-${catData.color}-400 font-bold px-2 py-1 rounded bg-${catData.color}-500/10">${catData.cat}</span>
                                </div>
                                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">${safeHTML(r.skills)}</p>
                            </div>
                        `}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-slate-900 dark:text-slate-100 tracking-tight">Kashfiyotlar (Muammolar)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="card-custom p-6 rounded-2xl relative hover-card">
                            <i class="fas fa-quote-left text-2xl text-slate-200 dark:text-slate-700/50 absolute top-5 right-5"></i>
                            <p class="text-slate-800 dark:text-slate-200 text-sm font-medium leading-relaxed relative z-10 pr-6 mb-5">"${safeHTML(pr.description)}"</p>
                            <div class="border-t border-slate-100 dark:border-slate-800 pt-4 flex items-center gap-2">
                                <i class="fas fa-user-secret text-slate-400 text-sm"></i>
                                <span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Anonim</span>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-custom fixed bottom-0 left-0 w-full z-50 rounded-none border-t border-b-0 border-l-0 border-r-0 pb-safe">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn p-3 text-brand active-tab flex flex-col items-center rounded-xl bg-brand/10 transition"><i class="fas fa-chart-pie text-lg mb-1"></i><span class="text-[10px] font-bold">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn p-3 text-slate-500 dark:text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-rocket text-lg mb-1"></i><span class="text-[10px] font-bold">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn p-3 text-slate-500 dark:text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-astronaut text-lg mb-1"></i><span class="text-[10px] font-bold">Kadr</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn p-3 text-slate-500 dark:text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-fire text-lg mb-1"></i><span class="text-[10px] font-bold">Muammo</span></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn p-3 text-slate-500 dark:text-slate-400 flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-circle text-lg mb-1"></i><span class="text-[10px] font-bold">Profil</span></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[70] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom w-full max-w-lg rounded-2xl p-8 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-slate-100 transition"><i class="fas fa-times"></i></button>
                    <h2 id="formTitle" class="text-xl font-bold mb-6 text-slate-900 dark:text-slate-100">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-4 mb-8"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand hover:bg-brandhover text-white py-3.5 rounded-xl font-bold transition shadow-sm">Bazaga saqlash</button>
                    <p id="formStatus" class="text-sm font-bold mt-4 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom w-full max-w-2xl rounded-2xl p-8 md:p-10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 dark:hover:text-slate-100 transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-bold mb-8 pr-10 text-slate-900 dark:text-slate-100">Sarlavha</h2>
                    <div class="space-y-5 mb-10">
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Muammo Sababi</h4>
                            <p id="modalCause" class="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                            <h4 class="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2">Manfaatdorlar</h4>
                            <p id="modalBenefits" class="text-slate-800 dark:text-slate-200 text-sm leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="bg-brand hover:bg-brandhover text-white w-full flex items-center justify-center gap-3 py-4 text-sm font-bold rounded-xl transition shadow-sm">
                        <i class="fab fa-telegram-plane"></i> Jamoaga qo'shilish (Telegram)
                    </a>
                </div>
            </div>

            ${installScript}
            <script>
                let authEmail = localStorage.getItem('adu_web_auth_email');
                if(authEmail) { document.getElementById('authGateway').style.display = 'none'; document.getElementById('userEmailDisplay').innerText = authEmail; }

                let waitingForOTP = false;
                async function checkLogin() {
                    const email = document.getElementById('loginEmail').value.trim();
                    const codeInput = document.getElementById('loginCode');
                    const code = codeInput.value.trim();
                    const err = document.getElementById('authErrorMsg'); 
                    const btn = document.getElementById('loginBtn');
                    err.classList.add('hidden'); 
                    
                    if(email === 'admin@adu.uz') {
                        if(!waitingForOTP) { waitingForOTP = true; codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; return; } 
                        else if(code === '7777') { localStorage.setItem('adu_web_auth_email', email); location.reload(); return; } 
                        else { err.innerText = "Parol xato!"; err.classList.remove('hidden'); return; }
                    }

                    btn.innerText = 'Kuting...';
                    if(!waitingForOTP) {
                        const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
                        if(res.ok) { waitingForOTP = true; codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; } 
                        else { const data = await res.json(); err.innerText = data.error || "Xato!"; err.classList.remove('hidden'); btn.innerText = "Kod yuborish"; }
                    } else {
                        const res = await fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, code }) });
                        if(res.ok) { localStorage.setItem('adu_web_auth_email', email); location.reload(); } 
                        else { err.innerText = "Kod xato!"; err.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; }
                    }
                }

                function logout() { localStorage.removeItem('adu_web_auth_email'); location.reload(); }

                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { 
                        if(el.classList.contains('mobile-nav-item')) { el.classList.remove('active-tab', 'text-brand', 'bg-brand/10'); el.classList.add('text-slate-500', 'dark:text-slate-400'); } 
                        else { el.classList.remove('active-tab', 'bg-brand/10', 'text-brand'); el.classList.add('text-slate-600', 'dark:text-slate-400'); }
                    });
                    
                    document.getElementById(id).classList.add('active');
                    btn.classList.add('active-tab'); 
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('text-brand', 'bg-brand/10'); btn.classList.remove('text-slate-500', 'dark:text-slate-400'); } 
                    else { btn.classList.add('bg-brand/10', 'text-brand'); btn.classList.remove('text-slate-600', 'dark:text-slate-400'); }
                }

                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type; const content = document.getElementById('formContent');
                    const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-3.5 rounded-xl text-sm mb-4 focus:outline-none focus:border-brand font-medium text-slate-900 dark:text-slate-100 transition";
                    
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Yangi Startap Qo'shish";
                        content.innerHTML = \`<input id="fTitle" placeholder="Loyiha nomi" class="\${inputClass}"><input id="fCause" placeholder="Muammo sababi" class="\${inputClass}"><textarea id="fGoal" placeholder="Asosiy maqsad" class="\${inputClass} h-24 resize-none"></textarea><input id="fBenefit" placeholder="Manfaatdorlar (Kimga foyda?)" class="\${inputClass} !mb-0">\`;
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Rezyume Qo'shish";
                        content.innerHTML = \`<textarea id="fSkills" placeholder="Qobiliyatlaringiz (Masalan: Node.js, Figma, Sotuv)" class="\${inputClass} h-32 resize-none !mb-0"></textarea>\`;
                    } else {
                        document.getElementById('formTitle').innerText = "Muammo Yozish";
                        content.innerHTML = \`<textarea id="fDesc" placeholder="Kuzatgan muammongizni yozing (Anonim qoladi)" class="\${inputClass} h-32 resize-none !mb-0"></textarea>\`;
                    }
                    document.getElementById('webFormModal').classList.remove('hidden'); document.getElementById('webFormModal').classList.add('flex'); document.getElementById('formStatus').classList.add('hidden');
                }

                function closeWebForm() { document.getElementById('webFormModal').classList.add('hidden'); document.getElementById('webFormModal').classList.remove('flex'); }

                async function submitWebForm() {
                    const status = document.getElementById('formStatus');
                    status.innerText = "Jo'natilmoqda..."; status.className = "text-sm font-bold mt-4 text-center text-brand block";
                    let data = {};
                    if(currentFormType === 'project') data = { title: document.getElementById('fTitle').value, cause: document.getElementById('fCause').value, goal: document.getElementById('fGoal').value, benefits: document.getElementById('fBenefit').value };
                    else if(currentFormType === 'resume') data = { skills: document.getElementById('fSkills').value };
                    else data = { description: document.getElementById('fDesc').value };

                    const res = await fetch('/api/add-item', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: authEmail, type: currentFormType, data }) });
                    if(res.ok) { status.innerText = "Muvaffaqiyatli saqlandi!"; status.className = "text-sm font-bold mt-4 text-center text-green-500 block"; setTimeout(() => location.reload(), 1000); } 
                    else { status.innerText = "Xatolik yuz berdi."; status.className = "text-sm font-bold mt-4 text-center text-red-500 block"; }
                }

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
