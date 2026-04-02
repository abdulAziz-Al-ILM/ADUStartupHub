const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer'); 

const app = express();
const prisma = new PrismaClient();
app.use(express.json());

// ==========================================
// ⚙️ GLOBAL SOZLAMALAR (Admin Panel Boshqaruvi)
// ==========================================
let globalSettings = {
    loginAccessEnabled: false, // Tizim avtomatik YOPIQ holatda boshlanadi
    aiDailyLimit: 10,
    emergencyAccess: false
};
let adminOtpStorage = {};     // Admin parollari
let tutorInvites = {};        // Tyutorlarning 10 daqiqalik taklif kodlari

// ==========================================
// 🚀 RAKETA LOGOTIPI (PWA SVG)
// ==========================================
app.get('/icon.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%"><rect width="512" height="512" rx="112" fill="#2563eb"/><g transform="translate(51.2, 51.2) scale(0.8)"><path fill="#ffffff" d="M398.5 113.5c-11.3-11.3-29.6-11.3-40.9 0l-55.3 55.3c-15.6-4.8-32.6-1.7-45.4 8.7L137.5 296.9c-11.3 11.3-11.3 29.6 0 40.9l45.4 45.4-37.3 119.2c-4.8 15.6-1.7 32.6 8.7 45.4 14.8 12 34.3 19.5 53.4 15.9 44.5-8.4 118.7-41.5 167.3-90.1 48.6-48.6 81.7-122.8 90.1-167.3 3.6-19.1-3.9-38.6-18.7-50.6l-55.3-55.3c10.4-12.8 13.5-29.8 8.7-45.4l119.2-37.3c15.6-4.8 32.6-1.7 45.4 8.7 12 14.8 19.5 34.3 15.9 53.4-8.4 44.5-41.5 118.7-90.1 167.3-48.6 48.6-122.8 81.7-167.3 90.1-19.1 3.6-38.6-3.9-50.6-18.7-10.4-12.8-13.5-29.8-8.7-45.4l55.3-55.3c-11.3-11.3-11.3-29.6 0-40.9s29.6-11.3 40.9 0l55.3-55.3c15.6 4.8 32.6 1.7 45.4-8.7L398.5 113.5zM256 224c0-17.7 14.3-32 32-32s32 14.3 32 32-14.3 32-32 32-32-14.3-32-32z"/></g></svg>`);
});

app.get('/app.webmanifest', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app", "display": "standalone",
        "background_color": "#0b1120", "theme_color": "#2563eb",
        "icons": [{"src": "/icon.svg", "sizes": "512x512", "type": "image/svg+xml", "purpose": "any"}]
    });
});

app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { self.skipWaiting(); }); self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); }); self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => new Response('Internet yoq'))); });`);
});

// ==========================================
// 👑 TEMIR ESHIK (ADMIN API)
// ==========================================
app.post('/api/admin/request-otp', async (req, res) => {
    const adminTgId = process.env.ADMIN_TG_ID;
    if(!adminTgId) return res.status(500).json({ error: "Serverda ADMIN_TG_ID yo'q!" });

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^*';
    let code = '';
    for(let i=0; i<20; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    adminOtpStorage[adminTgId] = { code, expires: Date.now() + 20000 };

    try {
        if(process.env.TELEGRAM_BOT_TOKEN) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ chat_id: adminTgId, text: `🔒 *TIZIMGA KIRISH KODI:*\n\n\`${code}\`\n\n_Ushbu kod faqat 20 soniya amal qiladi!_`, parse_mode: 'Markdown' })
            });
        }
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Xatolik" }); }
});

app.post('/api/admin/verify', (req, res) => {
    const { code } = req.body;
    const adminTgId = process.env.ADMIN_TG_ID;
    const record = adminOtpStorage[adminTgId];
    
    if(record && record.code === code && Date.now() < record.expires) {
        delete adminOtpStorage[adminTgId];
        res.json({ success: true, settings: globalSettings });
    } else {
        res.status(400).json({ error: "Kod xato yoki eskirgan (20 sek)!" });
    }
});

app.post('/api/admin/update', (req, res) => {
    globalSettings = { ...globalSettings, ...req.body };
    res.json({ success: true, settings: globalSettings });
});

app.post('/api/admin/add-tutor', async (req, res) => {
    const { email } = req.body;
    try {
        let user = await prisma.user.findUnique({ where: { email } });
        if(!user) user = await prisma.user.create({ data: { email, role: "TUTOR", isVerified: true, telegramId: BigInt(Date.now()) } });
        else await prisma.user.update({ where: { email }, data: { role: "TUTOR" } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "Xatolik" }); }
});

// ==========================================
// 🎓 TYUTOR API (10 DAQIQALIK KOD)
// ==========================================
app.post('/api/tutor/generate-invite', async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if(!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) return res.status(403).json({error: "Sizda tyutorlik huquqi yo'q!"});
    
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for(let i=0; i<6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    
    tutorInvites[code] = { tutor: email, expires: Date.now() + 10 * 60 * 1000 }; // 10 daqiqa yashaydi
    res.json({ success: true, code });
});

// ==========================================
// 🔐 FOYDALANUVCHILAR API (Login)
// ==========================================
app.post('/api/auth/send-otp', async (req, res) => {
    const { email, inviteCode } = req.body;
    if(email === 'admin@adu.uz') return res.json({ success: true }); 
    if (!email || (!email.endsWith('@adu.uz') && !email.endsWith('@gmail.com'))) return res.status(400).json({ error: "Faqat korporativ pochta qabul qilinadi" });
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    // TIZIM YOPIQ BO'LGANDA YANGI FOYDALANUVCHILAR UCHUN TEKSHIRUV:
    if(!globalSettings.loginAccessEnabled && !globalSettings.emergencyAccess) {
        if(!user || !user.isVerified) {
            if(!inviteCode) return res.status(403).json({ error: "Tizim yopiq! Tyutor tomonidan berilgan 6 xonali kodni kiriting." });
            const invite = tutorInvites[inviteCode];
            if(!invite || Date.now() > invite.expires) return res.status(400).json({ error: "Tyutor kodi xato yoki muddati tugagan (10 daqiqa)!" });
        }
    }
    
    const otp = generateOTP();
    if (!user) await prisma.user.create({ data: { email, otpCode: otp, isVerified: false, role: "STUDENT", telegramId: BigInt(Date.now()) } }); 
    else await prisma.user.update({ where: { email }, data: { otpCode: otp } });
    
    await sendOTP(email, otp);
    res.json({ success: true });
});

app.post('/api/auth/verify', async (req, res) => {
    const { email, code, inviteCode } = req.body;
    
    if (email === 'admin@adu.uz' && code === '7777') {
        let adminUser = await prisma.user.findUnique({ where: { email: 'admin@adu.uz' } });
        if(!adminUser) await prisma.user.create({ data: { email: 'admin@adu.uz', isVerified: true, role: "ADMIN", telegramId: BigInt(123456789) } });
        return res.json({ success: true, email }); 
    }
    
    if (globalSettings.emergencyAccess && code === '9999') {
        let user = await prisma.user.findUnique({ where: { email } });
        if (!user) await prisma.user.create({ data: { email, isVerified: true, role: "STUDENT", telegramId: BigInt(Date.now()) } });
        else await prisma.user.update({ where: { email }, data: { isVerified: true, otpCode: null } });
        return res.json({ success: true, email });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.otpCode === code) {
        let updateData = { isVerified: true, otpCode: null };
        
        // Agar Tyutor kodi orqali kirayotgan bo'lsa, biriktirib qo'yamiz
        if(inviteCode && tutorInvites[inviteCode]) {
            if(Date.now() <= tutorInvites[inviteCode].expires) {
                updateData.invitedBy = tutorInvites[inviteCode].tutor;
            }
            delete tutorInvites[inviteCode]; // Kod bir marta ishlatildi, yondiriladi!
        }

        await prisma.user.update({ where: { email }, data: updateData });
        res.json({ success: true, email });
    } else res.status(400).json({ error: "Maxfiy kod xato!" });
});

app.post('/api/user/me', async (req, res) => {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if(user) {
        const invitedCount = await prisma.user.count({ where: { invitedBy: email } });
        res.json({ role: user.role, email: user.email, invitedCount });
    } else res.status(401).json({ error: "Topilmadi" });
});

app.post('/api/add-item', async (req, res) => {
    const { email, type, data } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Avtorizatsiya xatosi" });
    try {
        if (type === 'project') await prisma.project.create({ data: { title: data.title, problemCause: data.cause, goal: data.goal, benefits: data.category, groupLink: data.link, authorId: user.id } });
        else if (type === 'resume') await prisma.resume.create({ data: { skills: data.category + ": " + data.skills, authorId: user.id } });
        else if (type === 'problem') await prisma.problem.create({ data: { description: data.description, authorId: user.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server xatosi" }); }
});

app.post('/api/delete-item', async (req, res) => {
    const { email, type, id } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Xato" });
    try {
        if(type === 'project') await prisma.project.delete({ where: { id: parseInt(id) } });
        else if(type === 'resume') await prisma.resume.delete({ where: { id: parseInt(id) } });
        res.json({ success: true });
    } catch(e) { res.status(500).json({ error: "O'chirishda xatolik" }); }
});

// ==========================================
// 🎨 UMUMIY CSS VA DIZAYN
// ==========================================
const headElements = `
    <link rel="manifest" href="/app.webmanifest?v=final">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <script>
        tailwind.config = { darkMode: 'class', theme: { extend: { colors: { brand: '#2563eb', brandhover: '#1d4ed8', darkbg: '#0b1120', darkcard: '#151e32', lightbg: '#f1f5f9' } } } }
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        function toggleTheme() { document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light'); }
    </script>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; transition: background-color 0.3s ease, color 0.3s ease; -webkit-tap-highlight-color: transparent; }
        
        .bg-grid { position: fixed; inset: 0; z-index: -2; background-size: 24px 24px; background-image: radial-gradient(circle, #94a3b8 1px, transparent 1px); opacity: 0.3; }
        .dark .bg-grid { background-image: radial-gradient(circle, #334155 1px, transparent 1px); opacity: 0.5; }
        
        body:not(.dark) { background-color: #f1f5f9; color: #334155; } 
        body:not(.dark) .card-custom { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        body:not(.dark) .text-primary { color: #0f172a; } body:not(.dark) .text-secondary { color: #64748b; }
        
        .dark body { background-color: #0b1120; color: #94a3b8; } 
        .dark .card-custom { background: #151e32; border: 1px solid #1e293b; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); }
        .dark .text-primary { color: #f8fafc; } .dark .text-secondary { color: #94a3b8; }
        
        .hover-card { transition: all 0.2s ease; } .hover-card:hover { transform: translateY(-3px); }
        body:not(.dark) .hover-card:hover { box-shadow: 0 10px 20px -5px rgba(37,99,235,0.15); border-color: #3b82f6; }
        .dark .hover-card:hover { box-shadow: 0 10px 20px -5px rgba(0,0,0,0.4); border-color: #3b82f6; }
        
        .border-divider { border-color: #e2e8f0; } .dark .border-divider { border-color: #1e293b; }

        @media print { aside, nav, .install-btn, .mobile-nav-item, button { display: none !important; } body { background: white !important; color: black !important; padding: 0; margin: 0; } main { padding: 0 !important; width: 100% !important; overflow: visible !important; } .card-custom { box-shadow: none !important; border: 1px solid #cbd5e1 !important; page-break-inside: avoid; background: white !important;} .text-primary, .text-secondary { color: black !important; } .dark .text-primary, .dark .text-secondary { color: black !important; } .progress-bar-bg { background-color: #f1f5f9 !important; border: 1px solid #e2e8f0 !important;} }
        @media (display-mode: standalone) { .install-btn-nav { display: none !important; } }
        .tab-content { display: none; animation: fadeUp 0.3s ease; } .tab-content.active { display: block; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;

const installScript = `
    <script>
        let dp; window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); dp = e; }); 
        function handleInstall() { 
            if(dp) { dp.prompt(); dp.userChoice.then(r => { if(r.outcome === 'accepted') dp = null; }); } 
            else { 
                const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
                if(isIOS) alert("Ilovani iPhone'ga o'rnatish:\\n1. Brauzer pastidagi 'Ulashish' belgisini bosing.\\n2. 'Ekranga qo'shish' ni tanlang.");
                else alert("Brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' ni bosing."); 
            } 
        } 
        document.querySelectorAll('.install-btn').forEach(b => b.addEventListener('click', handleInstall));
    </script>
`;

const safeHTML = (str) => str ? String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/[\r\n]+/g, ' ') : '';

function getCategory(text) {
    if (!text) return { cat: "Boshqa", color: "slate" };
    let lower = String(text).toLowerCase();
    if (lower.includes("dizayn")) return { cat: "Dizayn", color: "purple" };
    if (lower.includes("sotuv") || lower.includes("biznes")) return { cat: "Biznes", color: "amber" };
    if (lower.includes("marketing")) return { cat: "Marketing", color: "rose" };
    if (lower.includes("ekologiya")) return { cat: "Ekologiya", color: "emerald" };
    if (lower.includes("ta'lim")) return { cat: "Ta'lim", color: "indigo" };
    if (lower.includes("tibbiyot")) return { cat: "Tibbiyot", color: "red" };
    if (lower.includes("dasturlash") || lower.includes("it")) return { cat: "Dasturlash", color: "brand" };
    return { cat: "Boshqa", color: "slate" };
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
        <body class="min-h-screen flex flex-col relative">
            <div class="bg-grid"></div>
            <nav class="w-full card-custom fixed top-0 z-50 px-6 py-4 flex justify-between items-center rounded-none border-t-0 border-l-0 border-r-0 border-b border-divider">
                <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white"><i class="fas fa-rocket text-sm"></i></div><span class="text-xl font-bold tracking-tight text-primary">ADU Hub</span></div>
                <div class="flex gap-4 items-center">
                    <button onclick="toggleTheme()" class="text-secondary hover:text-brand transition text-lg"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button>
                    <button class="install-btn install-btn-nav bg-brand text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-brandhover transition shadow-sm">Ilovani olish</button>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight text-primary">Universitet g'oyalarini <span class="text-brand">bozorga aylantiramiz.</span></h1>
                <p class="text-lg md:text-xl text-secondary max-w-2xl mb-12 leading-relaxed">Eng iqtidorli talabalar, dasturchilar va startap asoschilari uchun yagona korporativ ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-6 mb-12">
                    <div class="card-custom px-10 py-6 rounded-2xl flex flex-col items-center min-w-[160px]"><span class="text-4xl font-black text-primary">${totalUsers}</span><span class="text-[11px] uppercase text-secondary font-bold mt-2 tracking-widest">A'zolar</span></div>
                    <div class="card-custom px-10 py-6 rounded-2xl flex flex-col items-center min-w-[160px] border-b-4 border-b-brand"><span class="text-4xl font-black text-brand">${activeProjects}</span><span class="text-[11px] uppercase text-secondary font-bold mt-2 tracking-widest">Startaplar</span></div>
                </div>
                <a href="/app" class="bg-primary bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-md flex items-center gap-3">Platformaga kirish <i class="fas fa-arrow-right"></i></a>
            </main>
            ${installScript}
        </body></html>
        `);
    } catch (e) { res.status(500).send("Xato"); }
});

// ==========================================
// 👑 ZIRHLI ESHIK (ADMIN PANEL)
// ==========================================
app.get('/admin', (req, res) => {
    res.send(`
    <!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Boshqaruv Paneli</title>${headElements}</head>
    <body class="h-screen flex items-center justify-center p-4">
        <div class="bg-grid"></div>
        <div id="adminAuth" class="card-custom w-full max-w-sm p-8 rounded-2xl text-center">
            <h2 class="text-2xl font-bold text-primary mb-2">Boshqaruv Paneli</h2>
            <p class="text-sm text-secondary mb-6">Tasdiqlash kodini telegram orqali oling</p>
            <input id="adminCode" type="text" placeholder="20 xonali murakkab kod" class="w-full bg-slate-100 dark:bg-slate-800 border border-divider rounded-xl px-4 py-3 mb-6 text-primary focus:outline-none focus:border-brand hidden">
            <button id="adminBtn" onclick="requestAdminCode()" class="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3 rounded-xl font-bold transition">Kodni Olish</button>
            <p id="adminErr" class="text-rose-500 text-sm mt-3 font-bold hidden"></p>
        </div>

        <div id="adminPanel" class="card-custom w-full max-w-2xl p-8 rounded-2xl hidden max-h-[90vh] overflow-y-auto">
            <h2 class="text-2xl font-bold text-primary mb-6 border-b border-divider pb-4">Tizim Sozlamalari</h2>
            
            <div class="flex items-center justify-between mb-6">
                <div><h4 class="font-bold text-primary">Tizimga kirish huquqi</h4><p class="text-xs text-secondary">Yangi a'zolar ulanishini cheklash</p></div>
                <button id="togAccess" onclick="toggleSetting('loginAccessEnabled')" class="px-4 py-2 bg-brand text-white rounded-lg font-bold text-sm">Yoqilgan</button>
            </div>
            
            <div class="flex items-center justify-between mb-6">
                <div><h4 class="font-bold text-primary">Favqulodda eshik</h4><p class="text-xs text-secondary">Parolsiz (9999) kirish ruxsati</p></div>
                <button id="togEmerg" onclick="toggleSetting('emergencyAccess')" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-primary rounded-lg font-bold text-sm">O'chirilgan</button>
            </div>
            
            <div class="flex items-center justify-between mb-6 border-t border-divider pt-6">
                <div><h4 class="font-bold text-primary">AI Kundalik Limiti</h4><p class="text-xs text-secondary">Kunlik so'rovlar miqdori</p></div>
                <input id="limitVal" type="number" class="w-20 bg-slate-100 dark:bg-slate-800 border border-divider rounded-lg px-3 py-2 text-primary text-center focus:outline-none">
            </div>
            <button onclick="saveAdminSettings()" class="w-full bg-emerald-500 text-white py-3 rounded-xl font-bold mt-4 shadow-sm hover:bg-emerald-600 transition">Saqlash</button>

            <h2 class="text-xl font-bold text-primary mb-4 border-b border-divider pb-2 mt-10">Tyutorlar (Mas'ullar)</h2>
            <div class="flex gap-2">
                <input id="tutorEmail" type="email" placeholder="Tyutor qilinadigan pochta..." class="flex-1 bg-slate-100 dark:bg-slate-800 border border-divider rounded-lg px-4 py-2 text-primary focus:outline-none focus:border-brand">
                <button onclick="addTutor()" class="px-6 bg-brand text-white font-bold rounded-lg hover:bg-brandhover transition">Qo'shish</button>
            </div>
        </div>
        <script>
            let settings = {};
            async function requestAdminCode() {
                const codeInput = document.getElementById('adminCode');
                const btn = document.getElementById('adminBtn');
                const err = document.getElementById('adminErr');
                err.classList.add('hidden');
                
                if(codeInput.classList.contains('hidden')) {
                    btn.innerText = "Kuting...";
                    const res = await fetch('/api/admin/request-otp', { method: 'POST' });
                    if(res.ok) { codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; }
                    else { err.innerText = "Server xatosi (Bot token yo'qmi?)"; err.classList.remove('hidden'); btn.innerText = "Kodni Olish"; }
                } else {
                    const code = codeInput.value;
                    const res = await fetch('/api/admin/verify', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({code}) });
                    if(res.ok) {
                        const data = await res.json(); settings = data.settings;
                        document.getElementById('adminAuth').classList.add('hidden');
                        document.getElementById('adminPanel').classList.remove('hidden'); updateUI();
                    } else { err.innerText = "Kod xato yoki muddati tugagan!"; err.classList.remove('hidden'); }
                }
            }
            function toggleSetting(key) { settings[key] = !settings[key]; updateUI(); }
            function updateUI() {
                document.getElementById('togAccess').innerText = settings.loginAccessEnabled ? "Yoqilgan" : "Yopilgan";
                document.getElementById('togAccess').className = settings.loginAccessEnabled ? "px-4 py-2 bg-brand text-white rounded-lg font-bold text-sm" : "px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm";
                document.getElementById('togEmerg').innerText = settings.emergencyAccess ? "Yoqilgan" : "O'chirilgan";
                document.getElementById('togEmerg').className = settings.emergencyAccess ? "px-4 py-2 bg-rose-500 text-white rounded-lg font-bold text-sm" : "px-4 py-2 bg-slate-200 dark:bg-slate-700 text-primary rounded-lg font-bold text-sm";
                document.getElementById('limitVal').value = settings.aiDailyLimit;
            }
            async function saveAdminSettings() {
                settings.aiDailyLimit = parseInt(document.getElementById('limitVal').value);
                await fetch('/api/admin/update', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) }); alert("Saqlandi!");
            }
            async function addTutor() {
                const email = document.getElementById('tutorEmail').value;
                if(!email) return;
                const res = await fetch('/api/admin/add-tutor', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email}) });
                if(res.ok) { alert(email + " tyutor qilindi!"); document.getElementById('tutorEmail').value = ""; }
                else alert("Xatolik yuz berdi");
            }
        </script>
    </body></html>
    `);
});

// ==========================================
// 2-XONA: ILOVA (Mukammal Dashboard, Tyutorlik va Shaxsiy Kabinet)
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

        let devCount = 0, designCount = 0, bizCount = 0, markCount = 0;
        resumes.forEach(r => {
            const cat = getCategory(r.skills).cat;
            if (cat === "Dizayn") designCount++; else if (cat === "Biznes") bizCount++; else if (cat === "Marketing") markCount++; else devCount++;
        });

        let sDevCount = 0, sDesignCount = 0, sBizCount = 0, sMarkCount = 0;
        activeProjects.forEach(p => {
            const cat = getCategory(p.benefits).cat;
            if (cat === "Dizayn") sDesignCount++; else if (cat === "Biznes") sBizCount++; else if (cat === "Marketing") sMarkCount++; else sDevCount++;
        });
        const totalProj = activeProjects.length || 1; const totalRes = resumes.length || 1;

        // Aniq 8 ta Kategoriya (Hamma joy uchun)
        const catOptions = `<option value="IT va Dasturlash">💻 IT va Dasturlash</option><option value="Dizayn va Media">🎨 Dizayn va Media</option><option value="Sotuv va Biznes">📈 Sotuv va Biznes</option><option value="Marketing va PR">🎯 Marketing va PR</option><option value="Ta'lim va Ilm-fan">📚 Ta'lim va Ilm-fan</option><option value="Ekologiya va Agro">🌱 Ekologiya va Agro</option><option value="Tibbiyot va Salomatlik">🏥 Tibbiyot va Salomatlik</option><option value="Boshqa">✨ Boshqa</option>`;

        res.send(`
        <!DOCTYPE html>
        <html lang="uz">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            ${headElements}
        </head>
        <body class="flex h-screen overflow-hidden">
            <div class="bg-grid"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-100/90 dark:bg-darkbg/95 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom p-10 rounded-[2rem] max-w-sm w-full text-center shadow-xl">
                    ${ROCKET_ICON_LARGE}
                    <h2 class="text-2xl font-extrabold mb-2 text-primary tracking-tight">Tizimga kirish</h2>
                    <p class="text-secondary mb-8 text-sm">Korporativ pochtani tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili (@adu.uz)" class="w-full bg-slate-100 dark:bg-slate-800 border border-divider rounded-xl px-5 py-3.5 mb-4 focus:outline-none focus:border-brand font-medium transition text-primary">
                    <input id="loginInviteCode" type="text" placeholder="Tyutor kodi (Yangilar uchun)" class="w-full bg-slate-100 dark:bg-slate-800 border border-divider rounded-xl px-5 py-3.5 mb-4 focus:outline-none focus:border-brand font-medium transition text-primary uppercase tracking-widest text-center" title="Tizim yopiq bo'lganda yangilar faqat Tyutorning 10 daqiqalik maxsus kodi orqali kira oladi">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-100 dark:bg-slate-800 border border-divider rounded-xl px-5 py-3.5 mb-6 focus:outline-none focus:border-brand font-medium hidden transition text-primary text-center tracking-[1em]">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-bold py-3.5 rounded-xl shadow-md transition">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-rose-500 text-sm mt-4 hidden font-bold">Xatolik</p>
                </div>
            </div>

            <aside class="w-[280px] card-custom h-full flex flex-col hidden md:flex z-20 border-t-0 border-l-0 border-b-0 rounded-none">
                <div class="p-6 flex items-center gap-3 border-b border-divider">
                    ${ROCKET_ICON}
                    <h1 class="text-lg font-extrabold text-primary tracking-tight">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-2 overflow-y-auto">
                    <p class="px-4 text-[11px] font-bold text-secondary uppercase tracking-widest mb-3 mt-4">Katalog</p>
                    <button onclick="switchTab('dashboard', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 rounded-xl active-tab bg-brand/10 text-brand font-semibold transition-all"><i class="fas fa-chart-pie w-5 text-center"></i> Tahlil</button>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-[11px] font-bold text-secondary uppercase tracking-widest mb-3 mt-8">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all"><i class="fas fa-user-circle w-5 text-center"></i> Profil</button>
                    <button id="tutorTabBtn" onclick="switchTab('tutorPanel', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-3.5 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition-all hidden"><i class="fas fa-chalkboard-teacher w-5 text-center text-amber-500"></i> Tyutor Paneli</button>
                </nav>
                <div class="p-6 border-t border-divider flex flex-col gap-3">
                    <button onclick="toggleTheme()" class="w-full flex items-center justify-center gap-3 px-4 py-3 text-secondary hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl font-semibold transition"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i> Mavzu</button>
                </div>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-28 md:p-10 z-10">
                <div class="md:hidden flex justify-between items-center mb-8 card-custom p-4 rounded-2xl shadow-sm">
                    <div class="flex items-center gap-3"><div class="w-8 h-8 rounded-lg bg-brand flex items-center justify-center text-white"><i class="fas fa-rocket text-sm"></i></div><span class="font-bold text-lg text-primary">ADU Hub</span></div>
                    <div class="flex gap-3"><button onclick="toggleTheme()" class="text-secondary w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800/50"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block text-amber-400"></i></button></div>
                </div>

                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-primary tracking-tight">Shaxsiy Kabinet</h2>
                    
                    <div class="card-custom p-8 rounded-[2rem] border-t-4 border-t-brand mb-8 flex flex-col md:flex-row md:justify-between items-start md:items-center gap-6">
                        <div class="flex items-center gap-5">
                            <div class="w-16 h-16 rounded-2xl bg-brand/10 flex items-center justify-center text-brand text-3xl"><i class="fas fa-user-astronaut"></i></div>
                            <div>
                                <h3 class="text-xl font-bold text-primary" id="userEmailDisplay">Yuklanmoqda...</h3>
                                <span id="roleBadge" class="text-[11px] font-bold px-3 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-2 inline-block uppercase tracking-widest border border-emerald-500/20">Tasdiqlangan</span>
                            </div>
                        </div>
                        <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <button class="install-btn px-6 py-3 bg-brand text-white rounded-xl text-sm font-bold hover:bg-brandhover transition w-full md:w-auto shadow-md"><i class="fas fa-download mr-2"></i> Ilovani O'rnatish</button>
                            <button onclick="logout()" class="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition w-full md:w-auto"><i class="fas fa-sign-out-alt mr-2"></i> Chiqish</button>
                        </div>
                    </div>
                    
                    <h3 class="text-sm font-bold text-secondary uppercase tracking-widest mb-5 mt-10 pl-2">Ma'lumot Qo'shish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        <div onclick="openWebForm('project')" class="card-custom border-2 border-dashed border-divider hover:border-brand cursor-pointer p-6 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-rocket text-2xl text-secondary group-hover:text-brand mb-2 transition"></i><p class="font-bold text-secondary group-hover:text-brand">Startap qo'shish</p></div>
                        <div onclick="openWebForm('resume')" class="card-custom border-2 border-dashed border-divider hover:border-purple-500 cursor-pointer p-6 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-dna text-2xl text-secondary group-hover:text-purple-500 mb-2 transition"></i><p class="font-bold text-secondary group-hover:text-purple-500">Rezyume (Kadr)</p></div>
                        <div onclick="openWebForm('problem')" class="card-custom border-2 border-dashed border-divider hover:border-amber-500 cursor-pointer p-6 rounded-2xl flex flex-col items-center justify-center text-center transition hover-card"><i class="fas fa-fire text-2xl text-secondary group-hover:text-amber-500 mb-2 transition"></i><p class="font-bold text-secondary group-hover:text-amber-500">Muammo yozish</p></div>
                    </div>

                    <h3 class="text-sm font-bold text-secondary uppercase tracking-widest mb-5 pl-2 border-t border-divider pt-8">Mening Ma'lumotlarimni Boshqarish</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="card-custom p-6 rounded-2xl">
                            <h4 class="font-bold text-primary mb-4 border-b border-divider pb-2"><i class="fas fa-rocket text-brand mr-2"></i> Startaplarim</h4>
                            <div id="myProjectsList" class="space-y-3"><p class="text-xs text-secondary italic">Sizda hali startap yo'q.</p></div>
                        </div>
                        <div class="card-custom p-6 rounded-2xl">
                            <h4 class="font-bold text-primary mb-4 border-b border-divider pb-2"><i class="fas fa-dna text-purple-500 mr-2"></i> Rezyumelarim</h4>
                            <div id="myResumesList" class="space-y-3"><p class="text-xs text-secondary italic">Sizda hali rezyume yo'q.</p></div>
                        </div>
                    </div>
                </div>

                <div id="tutorPanel" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-primary tracking-tight">Tyutor Paneli</h2>
                    <div class="card-custom p-8 rounded-[2rem] border-t-4 border-t-amber-500 mb-8">
                        <h3 class="font-bold text-primary mb-2">Talabalarni tizimga taklif qilish</h3>
                        <p class="text-sm text-secondary mb-6">Tizim yopiq paytida yangi talabalar faqat siz bergan qisqa kod orqali ro'yxatdan o'ta oladi. Kod 10 daqiqadan so'ng va 1 marta ishlatilgach kuyadi.</p>
                        <div class="flex items-center gap-3">
                            <div id="generatedInviteCode" class="flex-1 bg-slate-100 dark:bg-slate-800 border border-divider rounded-xl px-4 py-3 text-2xl font-black text-center text-amber-500 tracking-[0.5em] uppercase">------</div>
                            <button onclick="generateTutorCode()" class="bg-brand hover:bg-brandhover text-white px-6 py-4 rounded-xl font-bold shadow-md transition">Yaratish</button>
                        </div>
                        <p id="tutorCodeTimer" class="text-xs text-rose-500 font-bold mt-3 text-center hidden">10:00 daqiqadan so'ng faolsizlanadi</p>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div class="card-custom p-6 rounded-2xl">
                            <h4 class="font-bold text-primary mb-2"><i class="fas fa-users text-brand mr-2"></i> Kafil bo'lingan talabalar</h4>
                            <h3 id="invitedCountDisplay" class="text-4xl font-black text-brand mt-4">0</h3>
                        </div>
                    </div>
                </div>

                <div id="dashboard" class="tab-content active max-w-6xl mx-auto">
                    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                        <h2 class="text-3xl font-extrabold text-primary tracking-tight">Ekotizim Tahlili (Hisobot)</h2>
                        <button onclick="window.print()" class="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 text-primary rounded-xl font-bold text-sm hover:bg-brand hover:text-white transition shadow-sm"><i class="fas fa-print mr-2"></i> Chop etish</button>
                    </div>
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-brand"><p class="text-secondary text-[11px] font-bold uppercase tracking-widest mb-2">Umumiy A'zolar</p><h3 class="text-4xl font-black text-primary">${totalUsers}</h3></div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-amber-500"><p class="text-secondary text-[11px] font-bold uppercase tracking-widest mb-2">Jami Startaplar</p><h3 class="text-4xl font-black text-primary">${activeProjects.length}</h3></div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-purple-500"><p class="text-secondary text-[11px] font-bold uppercase tracking-widest mb-2">Kadrlar (Rezyume)</p><h3 class="text-4xl font-black text-primary">${resumes.length}</h3></div>
                        <div class="card-custom p-6 rounded-2xl border-t-4 border-t-rose-500"><p class="text-secondary text-[11px] font-bold uppercase tracking-widest mb-2">Kashfiyotlar</p><h3 class="text-4xl font-black text-primary">${problems.length}</h3></div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div class="card-custom p-6 md:p-8 rounded-2xl">
                            <h3 class="text-lg font-bold text-primary mb-6 border-b border-divider pb-4 flex items-center"><i class="fas fa-chart-pie text-purple-500 mr-3 text-xl"></i> Sohalar Bo'yicha Iqtidorlar</h3>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Dasturlash & IT</span><span class="font-bold text-primary">${devCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-brand h-3 rounded-full" style="width: ${(devCount/totalRes*100)||0}%"></div></div></div>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Dizayn & Media</span><span class="font-bold text-primary">${designCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-purple-500 h-3 rounded-full" style="width: ${(designCount/totalRes*100)||0}%"></div></div></div>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Biznes & Sotuv</span><span class="font-bold text-primary">${bizCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-amber-500 h-3 rounded-full" style="width: ${(bizCount/totalRes*100)||0}%"></div></div></div>
                            <div class="mb-2"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Marketing & Boshqa</span><span class="font-bold text-primary">${markCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-rose-500 h-3 rounded-full" style="width: ${(markCount/totalRes*100)||0}%"></div></div></div>
                        </div>
                        <div class="card-custom p-6 md:p-8 rounded-2xl">
                            <h3 class="text-lg font-bold text-primary mb-6 border-b border-divider pb-4 flex items-center"><i class="fas fa-layer-group text-rose-500 mr-3 text-xl"></i> Startap Sohalari</h3>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Dasturlash & IT</span><span class="font-bold text-primary">${sDevCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-brand h-3 rounded-full" style="width: ${(sDevCount/totalProj*100)||0}%"></div></div></div>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Dizayn & Media</span><span class="font-bold text-primary">${sDesignCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-purple-500 h-3 rounded-full" style="width: ${(sDesignCount/totalProj*100)||0}%"></div></div></div>
                            <div class="mb-5"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Biznes & Sotuv</span><span class="font-bold text-primary">${sBizCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-amber-500 h-3 rounded-full" style="width: ${(sBizCount/totalProj*100)||0}%"></div></div></div>
                            <div class="mb-2"><div class="flex justify-between text-sm mb-2"><span class="font-semibold text-secondary">Marketing & Boshqa</span><span class="font-bold text-primary">${sMarkCount}</span></div><div class="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 progress-bar-bg"><div class="bg-rose-500 h-3 rounded-full" style="width: ${(sMarkCount/totalProj*100)||0}%"></div></div></div>
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-primary tracking-tight">Faol Loyihalar</h2>
                    <div class="flex flex-col gap-4">
                        ${activeProjects.length > 0 ? activeProjects.map((p) => `
                            <div class="hover-card card-custom p-6 md:p-8 rounded-2xl cursor-pointer group flex flex-col md:flex-row md:items-center justify-between gap-4" onclick="openModal('${safeHTML(p.title)}', '${safeHTML(p.problemCause)}', '${safeHTML(p.goal)}', '${safeHTML(p.benefits)}', '${p.id}', true)">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <div class="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center"><i class="fas fa-rocket text-xs"></i></div>
                                        <h3 class="text-lg font-bold text-primary leading-tight">${safeHTML(p.title)}</h3>
                                        <span class="text-[10px] uppercase font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 text-secondary rounded ml-2 hidden md:block">${safeHTML(p.benefits)}</span>
                                    </div>
                                    <p class="text-sm text-secondary line-clamp-2 leading-relaxed ml-11">${safeHTML(p.goal)}</p>
                                </div>
                                <div class="hidden md:flex w-10 h-10 rounded-full border border-divider items-center justify-center text-secondary group-hover:bg-brand group-hover:border-brand group-hover:text-white transition"><i class="fas fa-arrow-right text-sm"></i></div>
                            </div>
                        `).join('') : '<p class="text-secondary">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-primary tracking-tight">Noyob Iqtidorlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${resumes.map(r => {
                            const parts = r.skills.split(':');
                            const catText = parts[0]; const descText = parts.slice(1).join(':') || r.skills;
                            const catData = getCategory(catText);
                            return `
                            <div class="card-custom p-5 rounded-2xl border-l-4 border-l-${catData.color}-500 hover-card cursor-pointer" onclick="openModal('Arizachi profili', 'Men haqimda / Ko\\'nikmalar', '${safeHTML(descText)}', '${safeHTML(catText)}', '${r.id}', false)">
                                <div class="flex justify-between items-center mb-3">
                                    <div class="flex items-center gap-3">
                                        <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><i class="fas fa-user-astronaut text-xs"></i></div>
                                        <span class="font-bold text-primary text-sm">Arizachi profili</span>
                                    </div>
                                    <span class="text-[10px] uppercase tracking-widest text-${catData.color}-600 dark:text-${catData.color}-400 font-bold px-2 py-1 rounded bg-${catData.color}-500/10">${catData.cat}</span>
                                </div>
                                <p class="text-sm text-secondary leading-relaxed line-clamp-2">${safeHTML(descText)}</p>
                            </div>
                        `}).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-3xl font-extrabold mb-8 text-primary tracking-tight">Kashfiyotlar (Muammolar)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="card-custom p-6 rounded-2xl relative hover-card">
                            <i class="fas fa-quote-left text-2xl text-slate-200 dark:text-slate-700/50 absolute top-5 right-5"></i>
                            <p class="text-primary text-sm font-medium leading-relaxed relative z-10 pr-6 mb-5">"${safeHTML(pr.description)}"</p>
                            <div class="border-t border-divider pt-4 flex items-center gap-2">
                                <i class="fas fa-user-secret text-secondary text-sm"></i>
                                <span class="text-[10px] text-secondary font-bold uppercase tracking-widest">Anonim</span>
                            </div>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-custom fixed bottom-0 left-0 w-full z-50 rounded-none border-t border-b-0 border-l-0 border-r-0 pb-safe">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('dashboard', this)" class="nav-btn p-3 text-brand active-tab flex flex-col items-center rounded-xl bg-brand/10 transition"><i class="fas fa-chart-pie text-lg mb-1"></i><span class="text-[10px] font-bold">Tahlil</span></button>
                    <button onclick="switchTab('startups', this)" class="nav-btn p-3 text-secondary flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-rocket text-lg mb-1"></i><span class="text-[10px] font-bold">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn p-3 text-secondary flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-astronaut text-lg mb-1"></i><span class="text-[10px] font-bold">Kadr</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn p-3 text-secondary flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-fire text-lg mb-1"></i><span class="text-[10px] font-bold">Muammo</span></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn p-3 text-secondary flex flex-col items-center rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition"><i class="fas fa-user-circle text-lg mb-1"></i><span class="text-[10px] font-bold">Profil</span></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[70] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom w-full max-w-lg rounded-2xl p-8 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-secondary flex items-center justify-center hover:text-primary transition"><i class="fas fa-times"></i></button>
                    <h2 id="formTitle" class="text-xl font-bold mb-6 text-primary">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-4 mb-8"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand hover:bg-brandhover text-white py-3.5 rounded-xl font-bold transition shadow-sm">Bazaga saqlash</button>
                    <p id="formStatus" class="text-sm font-bold mt-4 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 dark:bg-black/80 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-custom w-full max-w-2xl rounded-2xl p-8 md:p-10 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-6 right-6 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-secondary flex items-center justify-center hover:text-primary transition"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-bold mb-8 pr-10 text-primary">Sarlavha</h2>
                    <div class="space-y-5 mb-10">
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-divider">
                            <h4 id="lbl1" class="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Muammo Sababi</h4>
                            <p id="modalCause" class="text-primary text-sm leading-relaxed">...</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-divider">
                            <h4 id="lbl2" class="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Asosiy Maqsad</h4>
                            <p id="modalGoal" class="text-primary text-sm leading-relaxed">...</p>
                        </div>
                        <div id="benBox" class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-divider hidden">
                            <h4 id="lbl3" class="text-[11px] font-bold text-secondary uppercase tracking-widest mb-2">Kategoriya / Manfaatdorlar</h4>
                            <p id="modalBenefits" class="text-primary text-sm leading-relaxed">...</p>
                        </div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="bg-brand hover:bg-brandhover text-white w-full flex items-center justify-center gap-3 py-4 text-sm font-bold rounded-xl transition shadow-sm hidden">
                        <i class="fab fa-telegram-plane"></i> Jamoaga qo'shilish so'rovi
                    </a>
                </div>
            </div>

            ${installScript}
            <script>
                const myProjectsRaw = ${JSON.stringify(activeProjects)};
                const myResumesRaw = ${JSON.stringify(resumes)};
                const categoriesSelect = \`<option value="IT va Dasturlash">💻 IT va Dasturlash</option><option value="Dizayn va Media">🎨 Dizayn va Media</option><option value="Sotuv va Biznes">📈 Sotuv va Biznes</option><option value="Marketing va PR">🎯 Marketing va PR</option><option value="Ta'lim va Ilm-fan">📚 Ta'lim va Ilm-fan</option><option value="Ekologiya va Agro">🌱 Ekologiya va Agro</option><option value="Tibbiyot va Salomatlik">🏥 Tibbiyot va Salomatlik</option><option value="Boshqa">✨ Boshqa</option>\`;

                let authEmail = localStorage.getItem('adu_web_auth_email');
                if(authEmail) { 
                    document.getElementById('authGateway').style.display = 'none'; 
                    document.getElementById('userEmailDisplay').innerText = authEmail; 
                    renderMyItems(authEmail);
                    checkUserRole(authEmail);
                }

                // Tyutor panelini tekshirish
                async function checkUserRole(email) {
                    const res = await fetch('/api/user/me', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
                    if(res.ok) {
                        const data = await res.json();
                        if(data.role === 'TUTOR' || data.role === 'ADMIN') {
                            document.getElementById('roleBadge').innerText = "Tyutor (Mas'ul)";
                            document.getElementById('roleBadge').className = "text-[11px] font-bold px-3 py-1 rounded-md bg-amber-500/10 text-amber-600 mt-2 inline-block uppercase tracking-widest border border-amber-500/20";
                            document.getElementById('tutorTabBtn').classList.remove('hidden');
                            document.getElementById('invitedCountDisplay').innerText = data.invitedCount + " ta";
                        }
                    }
                }

                // Tyutor kod generatsiya qilishi
                async function generateTutorCode() {
                    const res = await fetch('/api/tutor/generate-invite', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email: authEmail}) });
                    if(res.ok) {
                        const data = await res.json();
                        document.getElementById('generatedInviteCode').innerText = data.code;
                        document.getElementById('tutorCodeTimer').classList.remove('hidden');
                        let timeLeft = 600;
                        const timerInterval = setInterval(() => {
                            timeLeft--;
                            let m = Math.floor(timeLeft/60); let s = timeLeft % 60;
                            document.getElementById('tutorCodeTimer').innerText = \`\${m}:\${s < 10 ? '0'+s : s} daqiqadan so'ng faolsizlanadi\`;
                            if(timeLeft <= 0) { clearInterval(timerInterval); document.getElementById('generatedInviteCode').innerText = "------"; document.getElementById('tutorCodeTimer').innerText = "Kod muddati tugadi"; }
                        }, 1000);
                    } else { alert("Sizda ruxsat yo'q yoki server xatosi"); }
                }

                function renderMyItems(email) {
                    const myProjHtml = myProjectsRaw.filter(p => p.author && p.author.email === email).map(p => 
                        \`<div class="flex justify-between items-center p-3 border border-divider bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span class="text-sm font-bold text-primary truncate w-3/4">\${p.title}</span>
                            <button onclick="deleteItem('project', \${p.id})" class="text-[10px] text-rose-500 font-bold px-2 py-1 bg-rose-50 dark:bg-rose-900/30 rounded hover:bg-rose-100 uppercase tracking-widest transition">O'chirish</button>
                        </div>\`
                    ).join('');
                    document.getElementById('myProjectsList').innerHTML = myProjHtml || "<p class='text-xs text-secondary italic'>Sizda startap yo'q.</p>";

                    const myResHtml = myResumesRaw.filter(r => r.author && r.author.email === email).map(r => 
                        \`<div class="flex justify-between items-center p-3 border border-divider bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <span class="text-sm font-bold text-primary truncate w-3/4">\${r.skills.split(':')[0]}</span>
                            <button onclick="deleteItem('resume', \${r.id})" class="text-[10px] text-rose-500 font-bold px-2 py-1 bg-rose-50 dark:bg-rose-900/30 rounded hover:bg-rose-100 uppercase tracking-widest transition">O'chirish</button>
                        </div>\`
                    ).join('');
                    document.getElementById('myResumesList').innerHTML = myResHtml || "<p class='text-xs text-secondary italic'>Sizda rezyume yo'q.</p>";
                }

                async function deleteItem(type, id) {
                    if(!confirm("Haqiqatan ham o'chirmoqchimisiz? (Bu amalni orqaga qaytarib bo'lmaydi)")) return;
                    const res = await fetch('/api/delete-item', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: authEmail, type, id }) });
                    if(res.ok) location.reload();
                }

                let waitingForOTP = false;
                async function checkLogin() {
                    const email = document.getElementById('loginEmail').value.trim();
                    const inviteCode = document.getElementById('loginInviteCode').value.trim().toUpperCase();
                    const codeInput = document.getElementById('loginCode');
                    const code = codeInput.value.trim();
                    const err = document.getElementById('authErrorMsg'); 
                    const btn = document.getElementById('loginBtn');
                    err.classList.add('hidden'); 
                    
                    if(email === 'admin@adu.uz') {
                        if(!waitingForOTP) { waitingForOTP = true; codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; return; } 
                    }

                    btn.innerText = 'Kuting...';
                    if(!waitingForOTP) {
                        const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, inviteCode }) });
                        if(res.ok) { waitingForOTP = true; codeInput.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; } 
                        else { const data = await res.json(); err.innerText = data.error || "Xato!"; err.classList.remove('hidden'); btn.innerText = "Kod yuborish"; }
                    } else {
                        const res = await fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, code, inviteCode }) });
                        if(res.ok) { localStorage.setItem('adu_web_auth_email', email); location.reload(); } 
                        else { const data = await res.json(); err.innerText = data.error || "Kod xato!"; err.classList.remove('hidden'); btn.innerText = "Tasdiqlash"; }
                    }
                }

                function logout() { localStorage.removeItem('adu_web_auth_email'); location.reload(); }

                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { 
                        if(el.classList.contains('mobile-nav-item')) { el.classList.remove('active-tab', 'text-brand', 'bg-brand/10'); el.classList.add('text-secondary'); } 
                        else { el.classList.remove('active-tab', 'bg-brand/10', 'text-brand'); el.classList.add('text-secondary'); }
                    });
                    
                    document.getElementById(id).classList.add('active');
                    btn.classList.add('active-tab'); 
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('text-brand', 'bg-brand/10'); btn.classList.remove('text-secondary'); } 
                    else { btn.classList.add('bg-brand/10', 'text-brand'); btn.classList.remove('text-secondary'); }
                }

                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type; const content = document.getElementById('formContent');
                    const inputClass = "w-full bg-slate-50 dark:bg-slate-800 border border-divider p-3.5 rounded-xl text-sm mb-4 focus:outline-none focus:border-brand font-medium text-primary transition";
                    
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Startap Qo'shish";
                        content.innerHTML = \`
                            <select id="fCategory" class="\${inputClass}">\${categoriesSelect}</select>
                            <input id="fTitle" placeholder="Loyiha nomi" class="\${inputClass}">
                            <input id="fCause" placeholder="Qanday muammoni hal qiladi?" class="\${inputClass}">
                            <textarea id="fGoal" placeholder="Asosiy maqsad va qisqacha ma'lumot" class="\${inputClass} h-20 resize-none"></textarea>
                            
                            <details class="mb-4 p-4 bg-brand/5 rounded-xl cursor-pointer border border-brand/20">
                                <summary class="font-bold text-brand text-sm outline-none">❗ Yopiq guruh linki (Yo'riqnoma)</summary>
                                <p class="text-xs text-secondary mt-3 leading-relaxed">Sizga arizalar kelishi uchun:<br>1. Telegramda yangi guruh oching.<br>2. Sozlamalardan uni "Private" (Yopiq) qiling.<br>3. "Invite Link"ni nusxalab pastga qo'shing.</p>
                            </details>
                            <input id="fLink" placeholder="Masalan: https://t.me/+AbCdEf" class="\${inputClass} !mb-0">\`;
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Rezyume Qo'shish";
                        content.innerHTML = \`
                            <select id="fCategory" class="\${inputClass}">\${categoriesSelect}</select>
                            <textarea id="fSkills" placeholder="O'zingiz haqingizda (Masalan: Backend yoza olaman, Figma bilaman...)" class="\${inputClass} h-32 resize-none !mb-0"></textarea>\`;
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
                    if(currentFormType === 'project') data = { title: document.getElementById('fTitle').value, cause: document.getElementById('fCause').value, goal: document.getElementById('fGoal').value, category: document.getElementById('fCategory').value, link: document.getElementById('fLink').value };
                    else if(currentFormType === 'resume') data = { skills: document.getElementById('fSkills').value, category: document.getElementById('fCategory').value };
                    else data = { description: document.getElementById('fDesc').value };

                    const res = await fetch('/api/add-item', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email: authEmail, type: currentFormType, data }) });
                    if(res.ok) { status.innerText = "Muvaffaqiyatli saqlandi!"; status.className = "text-sm font-bold mt-4 text-center text-green-500 block"; setTimeout(() => location.reload(), 1000); } 
                    else { status.innerText = "Xatolik yuz berdi."; status.className = "text-sm font-bold mt-4 text-center text-red-500 block"; }
                }

                function openModal(title, cause, goal, benefits, id, isProject) {
                    document.getElementById('modalTitle').innerText = title; 
                    document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal; 
                    
                    if(isProject) {
                        document.getElementById('lbl1').innerText = "Muammo Sababi";
                        document.getElementById('lbl2').innerText = "Asosiy Maqsad";
                        document.getElementById('benBox').classList.remove('hidden');
                        document.getElementById('modalBenefits').innerText = benefits;
                        document.getElementById('modalActionBtn').classList.remove('hidden');
                        document.getElementById('modalActionBtn').href = "https://t.me/ADUStartupHubBot?start=req_" + id; 
                    } else {
                        document.getElementById('lbl1').innerText = "Soha / Kategoriya";
                        document.getElementById('lbl2').innerText = "Ko'nikmalar / Tajriba";
                        document.getElementById('benBox').classList.add('hidden');
                        document.getElementById('modalActionBtn').classList.add('hidden');
                    }
                    
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
