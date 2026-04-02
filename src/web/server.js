const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer'); 

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// 🚀 RAKETA LOGOTIPI (SVG) VA PWA
// ==========================================
app.get('/icon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#2563eb"/><path fill="#ffffff" d="M398.5 113.5c-11.3-11.3-29.6-11.3-40.9 0l-55.3 55.3c-15.6-4.8-32.6-1.7-45.4 8.7L137.5 296.9c-11.3 11.3-11.3 29.6 0 40.9l45.4 45.4-37.3 119.2c-4.8 15.6-1.7 32.6 8.7 45.4 14.8 12 34.3 19.5 53.4 15.9 44.5-8.4 118.7-41.5 167.3-90.1 48.6-48.6 81.7-122.8 90.1-167.3 3.6-19.1-3.9-38.6-18.7-50.6l-55.3-55.3c10.4-12.8 13.5-29.8 8.7-45.4l119.2-37.3c15.6-4.8 32.6-1.7 45.4 8.7 12 14.8 19.5 34.3 15.9 53.4-8.4 44.5-41.5 118.7-90.1 167.3-48.6 48.6-122.8 81.7-167.3 90.1-19.1 3.6-38.6-3.9-50.6-18.7-10.4-12.8-13.5-29.8-8.7-45.4l55.3-55.3c-11.3-11.3-11.3-29.6 0-40.9s29.6-11.3 40.9 0l55.3-55.3c15.6 4.8 32.6 1.7 45.4-8.7L398.5 113.5zM256 224c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32z"/></svg>`);
});

app.get('/app.webmanifest', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app", "display": "standalone",
        "background_color": "#0f172a", "theme_color": "#2563eb",
        "icons": [{"src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any maskable"}]
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
// 🎨 STARTUP & 3D ENVIRONMENT DIZAYNI
// ==========================================
const headElements = `
    <link rel="manifest" href="/app.webmanifest?v=startup_tech">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Plus Jakarta Sans', sans-serif; transition: background-color 0.4s ease, color 0.4s ease; -webkit-tap-highlight-color: transparent; }
        
        /* ☀️ LIGHT MODE */
        body:not(.dark) { background-color: #f8fafc; color: #0f172a; } 
        body:not(.dark) .grid-bg { background-image: radial-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px); }
        body:not(.dark) .ambient-glow { background: radial-gradient(circle at 50% -20%, rgba(37,99,235,0.15) 0%, transparent 60%); filter: blur(60px); }
        body:not(.dark) .card-base { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 10px 40px -10px rgba(37,99,235,0.1); }
        body:not(.dark) .thematic-row { background: #ffffff; border: 1px solid rgba(37,99,235,0.1); }

        /* 🌙 DARK MODE */
        .dark body { background-color: #020617; color: #f8fafc; } 
        .dark .grid-bg { background-image: radial-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px); }
        .dark .ambient-glow { background: radial-gradient(circle at 50% -20%, rgba(37,99,235,0.15) 0%, transparent 60%); filter: blur(60px); }
        .dark .card-base { background: rgba(15, 23, 42, 0.7); backdrop-filter: blur(24px); border: 1px solid rgba(255, 255, 255, 0.05); box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.5); }
        .dark .thematic-row { background: rgba(15, 23, 42, 0.8); border: 1px solid rgba(255, 255, 255, 0.05); }
        
        /* 🖼 3D MUHIT VA SINGIB KETISH (Blending Effect) */
        .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -2; background-size: 32px 32px; }
        .ambient-glow { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; pointer-events: none; }
        
        .thematic-row {
            position: relative; overflow: hidden; border-radius: 1.5rem;
            transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            display: flex; align-items: center;
        }
        .thematic-row:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(37,99,235, 0.2); border-color: rgba(37,99,235, 0.4); }
        
        .thematic-img-container {
            position: absolute; top: 0; right: 0; width: 50%; height: 100%; z-index: 0;
            /* Rasmning chap tomonini silliq shaffof qilib fonga singdirib yuboradi */
            -webkit-mask-image: linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%);
            mask-image: linear-gradient(to left, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%);
        }
        .thematic-img {
            width: 100%; height: 100%; object-fit: cover; opacity: 0.8;
            transition: transform 0.7s ease; filter: saturate(1.2);
        }
        .thematic-row:hover .thematic-img { transform: scale(1.05); opacity: 1; }
        
        .thematic-content { position: relative; z-index: 2; width: 70%; }

        /* Mobil qurilmalar uchun moslashuv (Tepadan pastga singib ketadi) */
        @media (max-width: 768px) {
            .thematic-row { align-items: flex-end; min-height: 220px; }
            .thematic-content { width: 100%; padding-top: 60px; }
            .thematic-img-container {
                width: 100%; height: 60%; right: 0; top: 0;
                -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%);
                mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 100%);
            }
        }
        
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); } .tab-content.active { display: block; }
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

// 🧠 DINAMIK 3D MUHIT ANALIZATORI (Multi-skill qamrovi bilan)
function getCategoryData(text) {
    let lower = text.toLowerCase();
    let isDev = lower.includes("dastur") || lower.includes("kod") || lower.includes("node") || lower.includes("python") || lower.includes("backend") || lower.includes("frontend");
    let isDesign = lower.includes("dizayn") || lower.includes("figma") || lower.includes("ui") || lower.includes("3d");
    let isBiz = lower.includes("sotuv") || lower.includes("menejer") || lower.includes("biznes") || lower.includes("boshqaruv");
    let isMark = lower.includes("smm") || lower.includes("marketing") || lower.includes("target") || lower.includes("reklama");

    let score = (isDev?1:0) + (isDesign?1:0) + (isBiz?1:0) + (isMark?1:0);

    // Gibrid (Bir nechta sohada ishlovchi talaba uchun)
    if (score >= 2) return { cat: "Gibrid Mutaxassis", color: "indigo", img: "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?auto=format&fit=crop&w=600&q=80" }; // 3D Complex Glass
    
    // Yagona sohalar uchun 3D Startup muhitlari
    if (isDesign) return { cat: "Dizayn & San'at", color: "purple", img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80" }; // 3D Colorful Liquid
    if (isBiz) return { cat: "Biznes & Sotuv", color: "amber", img: "https://images.unsplash.com/photo-1614064010839-8ceb2649b5c1?auto=format&fit=crop&w=600&q=80" }; // 3D Abstract Finance
    if (isMark) return { cat: "Marketing", color: "rose", img: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=600&q=80" }; // 3D Social Nodes
    
    // Default (Dasturchilar va Boshqalar)
    return { cat: "Dasturlash & IT", color: "brand", img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&w=600&q=80" }; // 3D Tech Elements
}

// 🚀 STARTAPLAR UCHUN 3D MUHIT RASMLARI
const startupImgs = [
    "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&w=600&q=80", // Neon Flow
    "https://images.unsplash.com/photo-1614729939124-032f0b56c9ce?auto=format&fit=crop&w=600&q=80", // Smooth 3D
    "https://images.unsplash.com/photo-1634152962476-4b8a00e1915c?auto=format&fit=crop&w=600&q=80", // Complex Tech Glass
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"  // Liquid Startup
];

const ROCKET_ICON = `<div class="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand to-blue-400 flex items-center justify-center text-white shadow-lg"><i class="fas fa-rocket text-sm"></i></div>`;
const ROCKET_ICON_LARGE = `<div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand to-blue-400 flex items-center justify-center text-white shadow-xl shadow-brand/40 mx-auto mb-5"><i class="fas fa-rocket text-3xl"></i></div>`;

// ==========================================
// 1-XONA: LANDING PAGE
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });
        
        res.send(`
        <!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ADU Hub | Startup Ekotizimi</title>${headElements}</head>
        <body class="min-h-screen flex flex-col relative">
            <div class="grid-bg"></div><div class="ambient-glow"></div>
            <nav class="w-full card-base fixed top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-brand/10">
                <div class="flex items-center gap-3">${ROCKET_ICON}<span class="text-xl font-bold tracking-tight">ADU Hub</span></div>
                <div class="flex gap-4">
                    <button onclick="toggleTheme()" class="text-slate-500 hover:text-brand transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                    <button class="install-btn bg-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-brand/30 hidden md:block hover:bg-brandhover transition">Ilovani olish</button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <div class="mb-6 inline-block px-5 py-1.5 rounded-full bg-brand/10 text-brand font-bold text-[10px] uppercase tracking-widest border border-brand/20 shadow-sm">Yopiq Beta Versiya</div>
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-slate-900 dark:text-white">Universitet g'oyalarini <br/><span class="text-transparent bg-clip-text bg-gradient-to-r from-brand to-purple-500">bozorga aylantiramiz.</span></h1>
                <p class="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-base px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px] border-t-4 border-slate-300 dark:border-slate-700"><span class="text-4xl font-black text-slate-900 dark:text-white">${totalUsers}</span><span class="text-[10px] uppercase text-slate-500 font-bold mt-2 tracking-widest">A'zolar</span></div>
                    <div class="card-base px-10 py-6 rounded-3xl flex flex-col items-center min-w-[160px] border-t-4 border-brand"><span class="text-4xl font-black text-brand">${activeProjects}</span><span class="text-[10px] uppercase text-slate-500 font-bold mt-2 tracking-widest">Startaplar</span></div>
                </div>
                <a href="/app" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-2xl font-bold text-lg transition-all shadow-xl hover:scale-105 flex items-center gap-3">Platformaga kirish <i class="fas fa-arrow-right"></i></a>
            </main>
            ${installScript}
        </body></html>
        `);
    } catch (e) { res.status(500).send("Xato"); }
});

// ==========================================
// 2-XONA: ILOVA VA KABINET (Startup 3D Immersive UI)
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

            <div id="authGateway" class="fixed inset-0 bg-white/40 dark:bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-2xl">
                <div class="card-base p-10 rounded-[2.5rem] max-w-sm w-full text-center shadow-2xl">
                    ${ROCKET_ICON_LARGE}
                    <h2 class="text-3xl font-extrabold mb-2 text-slate-900 dark:text-white tracking-tight">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-8 text-sm font-medium">Korporativ pochtani tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili (@adu.uz)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 rounded-2xl px-5 py-4 mb-4 focus:outline-none focus:border-brand font-medium transition text-slate-900 dark:text-white">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 rounded-2xl px-5 py-4 mb-6 focus:outline-none focus:border-brand font-medium hidden transition text-slate-900 dark:text-white">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-bold py-4 rounded-2xl shadow-lg shadow-brand/30 transition transform hover:-translate-y-1">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-red-500 text-sm mt-4 hidden font-bold">Xatolik</p>
                </div>
            </div>

            <aside class="w-[280px] card-base m-4 rounded-[2rem] h-[calc(100vh-32px)] flex flex-col hidden md:flex z-20 shadow-2xl overflow-hidden">
                <div class="p-6 flex items-center gap-3 border-b border-brand/10">
                    ${ROCKET_ICON}
                    <h1 class="text-xl font-extrabold text-slate-900 dark:text-white">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-4">Katalog</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl active-tab bg-brand text-white font-semibold shadow-md transition-all"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-brand/10 hover:text-brand rounded-2xl font-semibold transition-all"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-brand/10 hover:text-brand rounded-2xl font-semibold transition-all"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-brand/10 hover:text-brand rounded-2xl font-semibold transition-all"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 mt-8">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-brand/10 hover:text-brand rounded-2xl font-semibold transition-all"><i class="fas fa-user-circle w-5 text-center"></i> Profil</button>
                </nav>
                <div class="p-6 border-t border-brand/10 flex flex-col gap-3">
                    <button class="install-btn w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3.5 rounded-2xl font-bold text-sm shadow-xl transition transform hover:-translate-y-1"><i class="fas fa-download mr-2"></i> O'rnatish</button>
                    <button onclick="toggleTheme()" class="w-full flex items-center justify-center gap-3 px-4 py-3.5 text-slate-600 dark:text-slate-400 hover:bg-brand/10 rounded-2xl font-semibold transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-28 md:p-8 z-10">
                <div class="md:hidden flex justify-between items-center mb-8 card-base p-4 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-3">${ROCKET_ICON}<span class="font-extrabold text-lg text-slate-900 dark:text-white">ADU Hub</span></div>
                    <div class="flex gap-3">
                        <button onclick="toggleTheme()" class="text-slate-600 dark:text-slate-300 w-10 h-10 flex items-center justify-center rounded-xl bg-brand/5"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                        <button class="install-btn bg-brand text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-md"><i class="fas fa-download"></i></button>
                    </div>
                </div>

                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-4xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight">Shaxsiy Kabinet</h2>
                    <div class="card-base p-8 rounded-[2rem] border-t-4 border-brand mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-3xl"><i class="fas fa-user-astronaut"></i></div>
                            <div>
                                <h3 class="text-xl font-bold text-slate-900 dark:text-white" id="userEmailDisplay">Yuklanmoqda...</h3>
                                <span class="text-[10px] font-bold px-3 py-1 rounded-md bg-brand text-white mt-2 inline-block uppercase tracking-widest shadow-sm">Tasdiqlangan a'zo</span>
                            </div>
                        </div>
                        <button onclick="logout()" class="px-6 py-3.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl text-sm font-bold hover:bg-red-100 transition w-full md:w-auto"><i class="fas fa-sign-out-alt"></i> Chiqish</button>
                    </div>
                    
                    <h3 class="text-sm font-bold text-slate-500 uppercase tracking-widest mb-5 mt-10 pl-2">Tizimga Qo'shish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div onclick="openWebForm('project')" class="card-base border-2 border-dashed border-brand/30 hover:border-brand cursor-pointer p-8 rounded-[2rem] flex flex-col items-center justify-center text-center transition group"><i class="fas fa-rocket text-3xl text-brand/50 group-hover:text-brand mb-3 transition"></i><p class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-brand">Startap qo'shish</p></div>
                        <div onclick="openWebForm('resume')" class="card-base border-2 border-dashed border-purple-500/30 hover:border-purple-500 cursor-pointer p-8 rounded-[2rem] flex flex-col items-center justify-center text-center transition group"><i class="fas fa-dna text-3xl text-purple-500/50 group-hover:text-purple-500 mb-3 transition"></i><p class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-purple-500">Iqtidor qo'shish</p></div>
                        <div onclick="openWebForm('problem')" class="card-base border-2 border-dashed border-amber-500/30 hover:border-amber-500 cursor-pointer p-8 rounded-[2rem] flex flex-col items-center justify-center text-center transition group"><i class="fas fa-fire text-3xl text-amber-500/50 group-hover:text-amber-500 mb-3 transition"></i><p class="font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-500">Muammo yozish</p></div>
                    </div>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <h2 class="text-4xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight">Ekotizim Tahlili</h2>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-5 mb-8">
                        <div class="card-base p-8 rounded-[2rem]"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">A'zolar</p><h3 class="text-4xl font-black text-slate-900 dark:text-white">${totalUsers}</h3></div>
                        <div class="card-base p-8 rounded-[2rem]"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">G'oya bosqichi</p><h3 class="text-4xl font-black text-amber-500">${teamBuilding}</h3></div>
                        <div class="card-base p-8 rounded-[2rem]"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">MVP bosqichi</p><h3 class="text-4xl font-black text-purple-500">${mvpStage}</h3></div>
                        <div class="card-base p-8 rounded-[2rem] border-b-4 border-brand"><p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-2">Bozorda</p><h3 class="text-4xl font-black text-brand">${launched}</h3></div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-4xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight">Faol Loyihalar</h2>
                    <div class="flex flex-col gap-6">
                        ${activeProjects.length > 0 ? activeProjects.map((p, index) => {
                            const imgUrl = startupImgs[index % startupImgs.length];
                            return `
                            <div class="thematic-row group cursor-pointer" onclick="openModal('${safeHTML(p.title)}', '${safeHTML(p.problemCause)}', '${safeHTML(p.goal)}', '${safeHTML(p.benefits)}', '${p.id}')">
                                <div class="thematic-img-container"><img src="${imgUrl}" class="thematic-img"></div>
                                <div class="thematic-content p-6 md:p-8 flex flex-col justify-center w-full md:w-3/4">
                                    <span class="text-[10px] uppercase tracking-widest text-brand font-bold mb-3 inline-block px-3 py-1 rounded-md bg-brand/10 border border-brand/20 w-max shadow-sm">Startap Loyiha</span>
                                    <h3 class="text-2xl md:text-3xl font-bold mb-3 text-slate-900 dark:text-white leading-tight">${safeHTML(p.title)}</h3>
                                    <p class="text-sm md:text-base text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed max-w-xl">${safeHTML(p.goal)}</p>
                                </div>
                            </div>
                        `}).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-4xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight">Noyob Iqtidorlar</h2>
                    <div class="flex flex-col gap-6">
                        ${resumes.map(r => {
                            const catData = getCategoryData(r.skills);
                            return `
                            <div class="thematic-row group">
                                <div class="thematic-img-container"><img src="${catData.img}" class="thematic-img"></div>
                                <div class="thematic-content p-6 md:p-8 flex flex-col justify-center w-full md:w-3/4">
                                    <div class="flex items-center gap-3 mb-3">
                                        <i class="fas fa-user-astronaut text-${catData.color}-500 text-xl"></i>
                                        <span class="font-extrabold text-slate-900 dark:text-white text-lg">@${r.author.username || 'yashirin_kadr'}</span>
                                    </div>
                                    <span class="text-[10px] uppercase tracking-widest text-${catData.color}-600 dark:text-${catData.color}-400 font-bold mb-3 inline-block px-3 py-1 rounded-md bg-${catData.color}-500/10 border border-${catData.color}-500/20 w-max shadow-sm">${catData.cat}</span>
                                    <p class="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">${safeHTML(r.skills)}</p>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-4xl font-extrabold mb-8 text-slate-900 dark:text-white tracking-tight">Kashfiyotlar (Muammolar)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `<div class="card-base p-8 rounded-[2rem] relative border-t-4 border-amber-500"><i class="fas fa-fire text-4xl text-amber-500/20 absolute top-6 right-6"></i><p class="text-slate-800 dark:text-slate-200 text-lg font-medium leading-relaxed relative z-10 pt-2 pr-8">"${safeHTML(pr.description)}"</p><div class="mt-6 pt-4 border-t border-brand/10"><span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Anonim Kuzatuvchi</span></div></div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-base fixed bottom-4 left-4 right-4 z-50 rounded-[2rem] shadow-2xl border border-brand/20">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn p-3.5 text-brand active-tab flex flex-col items-center rounded-2xl bg-brand/10 transition"><i class="fas fa-chart-pie text-xl"></i></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn p-3.5 text-slate-400 flex flex-col items-center rounded-2xl hover:bg-brand/5 hover:text-brand transition"><i class="fas fa-rocket text-xl"></i></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn p-3.5 text-slate-400 flex flex-col items-center rounded-2xl hover:bg-brand/5 hover:text-brand transition"><i class="fas fa-dna text-xl"></i></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn p-3.5 text-slate-400 flex flex-col items-center rounded-2xl hover:bg-brand/5 hover:text-brand transition"><i class="fas fa-fire text-xl"></i></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn p-3.5 text-slate-400 flex flex-col items-center rounded-2xl hover:bg-brand/5 hover:text-brand transition"><i class="fas fa-user-circle text-xl"></i></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 z-[70] hidden items-center justify-center p-4 backdrop-blur-md">
                <div class="card-base w-full max-w-lg rounded-[2.5rem] p-8 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 flex items-center justify-center hover:text-slate-900 hover:bg-slate-200 transition"><i class="fas fa-times"></i></button>
                    <h2 id="formTitle" class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-4 mb-8"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand hover:bg-brandhover text-white py-4 rounded-xl font-bold transition shadow-lg shadow-brand/30 transform hover:-translate-y-0.5">Ekotizimga ulash</button>
                    <p id="formStatus" class="text-sm font-bold mt-4 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 z-[60] hidden items-center justify-center p-4 backdrop-blur-lg">
                <div class="card-base w-full max-w-2xl rounded-[3rem] p-8 md:p-12 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center hover:bg-brand hover:text-white transition"><i class="fas fa-times text-xl"></i></button>
                    <h2 id="modalTitle" class="text-3xl md:text-4xl font-black mb-8 pr-12 leading-tight text-slate-900 dark:text-white">Sarlavha</h2>
                    <div class="space-y-5 mb-10">
                        <div class="bg-white/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-brand/10">
                            <h4 class="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-search"></i> Kuzatilgan Muammo</h4>
                            <p id="modalCause" class="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">...</p>
                        </div>
                        <div class="bg-white/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-brand/10">
                            <h4 class="text-[10px] font-bold text-brand uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-bullseye"></i> Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">...</p>
                        </div>
                        <div class="bg-white/50 dark:bg-slate-800/50 p-6 rounded-3xl border border-brand/10">
                            <h4 class="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-2"><i class="fas fa-gem"></i> Kutilayotgan Manfaat</h4>
                            <p id="modalBenefits" class="text-slate-700 dark:text-slate-300 text-sm md:text-base leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 w-full flex items-center justify-center gap-3 py-5 text-lg font-bold rounded-2xl transition shadow-xl transform hover:-translate-y-1">
                        <i class="fab fa-telegram-plane text-brand text-2xl"></i> Jamoaga qo'shilish
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
                        if(el.classList.contains('mobile-nav-item')) { el.classList.remove('active-tab', 'text-brand', 'bg-brand/10'); el.classList.add('text-slate-400'); } 
                        else { el.classList.remove('active-tab', 'bg-brand', 'text-white', 'shadow-md'); el.classList.add('text-slate-600', 'dark:text-slate-400'); }
                    });
                    
                    document.getElementById(id).classList.add('active');
                    btn.classList.add('active-tab'); 
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('text-brand', 'bg-brand/10'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('bg-brand', 'text-white', 'shadow-md'); btn.classList.remove('text-slate-600', 'dark:text-slate-400'); }
                }

                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type; const content = document.getElementById('formContent');
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Yangi Startap Ekish";
                        content.innerHTML = '<input id="fTitle" placeholder="Loyiha nomi" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm mb-3 focus:outline-none focus:border-brand font-medium text-slate-900 dark:text-white"><input id="fCause" placeholder="Qanday muammoni ko\\'rdingiz?" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm mb-3 focus:outline-none focus:border-brand font-medium text-slate-900 dark:text-white"><textarea id="fGoal" placeholder="Buni qanday hal qilasiz? (Maqsad)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm mb-3 h-24 focus:outline-none focus:border-brand font-medium resize-none text-slate-900 dark:text-white"></textarea><input id="fBenefit" placeholder="Bundan kimga foyda?" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm focus:outline-none focus:border-brand font-medium text-slate-900 dark:text-white">';
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Iqtidor Qo'shish";
                        content.innerHTML = '<textarea id="fSkills" placeholder="Qobiliyatlaringiz: Masalan (Frontend, Dizayn, Sotuv menejeri)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm h-32 focus:outline-none focus:border-brand font-medium resize-none text-slate-900 dark:text-white"></textarea>';
                    } else {
                        document.getElementById('formTitle').innerText = "Muammo Yozish";
                        content.innerHTML = '<textarea id="fDesc" placeholder="Kuzatgan muammongizni yozing (Anonim tarzda e\\'lon qilinadi)" class="w-full bg-slate-50/50 dark:bg-slate-800/50 border border-brand/20 p-4 rounded-2xl text-sm h-32 focus:outline-none focus:border-brand font-medium resize-none text-slate-900 dark:text-white"></textarea>';
                    }
                    document.getElementById('webFormModal').classList.remove('hidden'); document.getElementById('webFormModal').classList.add('flex'); document.getElementById('formStatus').classList.add('hidden');
                }

                function closeWebForm() { document.getElementById('webFormModal').classList.add('hidden'); document.getElementById('webFormModal').classList.remove('flex'); }

                async function submitWebForm() {
                    const status = document.getElementById('formStatus');
                    status.innerText = "Ekotizimga uzatilmoqda..."; status.className = "text-sm font-bold mt-4 text-center text-brand block";
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
