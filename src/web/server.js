const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer'); // Pochtalyonni ulaymiz
const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// ==========================================
// 🔐 WEB API: MUSTAQIL AVTORIZATSIYA
// ==========================================
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || (!email.endsWith('@adu.uz') && !email.endsWith('@gmail.com'))) {
        return res.status(400).json({ error: "Faqat @adu.uz pochtasi qabul qilinadi" });
    }
    const otp = generateOTP();
    
    // Foydalanuvchini bazadan qidiramiz yoki Telegramsiz yangi yaratamiz
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        await prisma.user.create({ data: { email, otpCode: otp, isVerified: false } });
    } else {
        await prisma.user.update({ where: { email }, data: { otpCode: otp } });
    }
    
    await sendOTP(email, otp);
    res.json({ success: true });
});

app.post('/api/auth/verify', async (req, res) => {
    const { email, code } = req.body;
    if (email === 'admin@adu.uz' && code === '7777') return res.json({ success: true, email }); // Admin Backdoor
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (user && user.otpCode === code) {
        await prisma.user.update({ where: { email }, data: { isVerified: true, otpCode: null } });
        res.json({ success: true, email });
    } else {
        res.status(400).json({ error: "Maxfiy kod noto'g'ri kiritildi" });
    }
});

// ==========================================
// 📝 WEB API: MA'LUMOT QO'SHISH (Saytning o'zidan)
// ==========================================
app.post('/api/add-item', async (req, res) => {
    const { email, type, data } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Avtorizatsiya xatosi" });

    try {
        if (type === 'project') {
            await prisma.project.create({ data: { title: data.title, problemCause: data.cause, goal: data.goal, benefits: data.benefits, authorId: user.id } });
        } else if (type === 'resume') {
            await prisma.resume.create({ data: { skills: data.skills, authorId: user.id } });
        } else if (type === 'problem') {
            await prisma.problem.create({ data: { description: data.description, authorId: user.id } });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Serverda xatolik" });
    }
});


// ==========================================
// 🚀 PWA STANDALONE FIX
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app", "display": "standalone",
        "background_color": "#ffffff", "theme_color": "#2563eb",
        "icons": [{"src": "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]
    });
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { self.skipWaiting(); }); self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); }); self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => new Response('Internet yo\\'q'))); });`);
});

const headElements = `
    <link rel="manifest" href="/manifest.json">
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
        body:not(.dark) { background-color: #f8fafc; color: #0f172a; } .card-light { background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
        .dark body { background-color: #0f172a; color: #f8fafc; } .dark .card-light { background: #1e293b; border: 1px solid #334155; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
        .header-glow { position: absolute; top: 0; left: 50%; transform: translateX(-50%); width: 100vw; height: 40vh; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 70%); z-index: -1; pointer-events: none; }
        .dark .header-glow { background: radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%); }
        .hover-card { transition: all 0.2s ease; } .hover-card:hover { transform: translateY(-2px); box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1); border-color: #3b82f6; }
        .dark .hover-card:hover { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-color: #3b82f6; }
        @media (display-mode: standalone) { .install-btn { display: none !important; } }
        .tab-content { display: none; animation: fadeIn 0.3s ease; } .tab-content.active { display: block; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    </style>
`;
const installScript = `<script>let dp; window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); dp = e; }); function hi() { if(dp) { dp.prompt(); dp.userChoice.then(r => { if(r.outcome === 'accepted') dp = null; }); } else { alert("Menyudan 'Ekranga qo'shish' ni bosing."); } } document.querySelectorAll('.install-btn').forEach(b => b.addEventListener('click', hi));</script>`;
const LOGO_URL = "https://cdn-icons-png.flaticon.com/512/3135/3135715.png";

// ==========================================
// 1-XONA: LANDING PAGE
// ==========================================
app.get('/', async (req, res) => {
    res.send(`
        <!DOCTYPE html><html lang="uz"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>ADU Hub</title>${headElements}</head>
        <body class="min-h-screen flex flex-col relative"><div class="header-glow"></div>
            <nav class="w-full card-light fixed top-0 z-50 px-6 py-4 flex justify-between items-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div class="flex items-center gap-3"><img src="${LOGO_URL}" class="w-8 h-8"><span class="text-xl font-bold text-slate-900 dark:text-white">ADU Hub</span></div>
                <div class="flex gap-4"><button onclick="toggleTheme()" class="text-slate-500"><i class="fas fa-moon dark:hidden"></i><i class="fas fa-sun hidden dark:block"></i></button></div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <h1 class="text-5xl md:text-6xl font-extrabold mb-6">G'oyalarni <span class="text-brand">bozorga aylantiramiz.</span></h1>
                <a href="/app" class="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-4 rounded-xl font-semibold transition">Platformaga kirish &rarr;</a>
            </main>
        </body></html>
    `);
});

// ==========================================
// 2-XONA: HAQIQIY ILOVA VA PROFIL (KABINET)
// ==========================================
app.get('/app', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
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
        <body class="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
            <div class="header-glow"></div>

            <div id="authGateway" class="fixed inset-0 bg-slate-900/80 z-[100] flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light p-8 rounded-2xl max-w-sm w-full text-center shadow-xl">
                    <div class="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6"><i class="fas fa-lock text-brand text-2xl"></i></div>
                    <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">Tizimga kirish</h2>
                    <p class="text-slate-500 mb-6 text-sm">Korporativ pochta orqali tasdiqlang</p>
                    
                    <input id="loginEmail" type="email" placeholder="Pochta manzili (@adu.uz)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-4 text-slate-900 dark:text-white focus:outline-none focus:border-brand text-sm">
                    <input id="loginCode" type="number" placeholder="4 xonali kod (OTP)" class="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 mb-6 text-slate-900 dark:text-white focus:outline-none focus:border-brand text-sm hidden">
                    
                    <button id="loginBtn" onclick="checkLogin()" class="w-full bg-brand hover:bg-brandhover text-white font-semibold py-3 rounded-lg transition shadow-sm">Kod yuborish</button>
                    <p id="authErrorMsg" class="text-red-500 text-sm mt-3 hidden font-medium">Xatolik</p>
                </div>
            </div>

            <aside class="w-64 card-light h-full flex flex-col hidden md:flex z-20 border-r border-slate-200 dark:border-slate-800 rounded-none bg-white dark:bg-slate-900">
                <div class="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
                    <img src="${LOGO_URL}" alt="Logo" class="w-8 h-8 object-contain">
                    <h1 class="text-lg font-bold text-slate-900 dark:text-white tracking-tight">ADU Hub</h1>
                </div>
                <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-4">Katalog</p>
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left font-medium active-tab bg-blue-50 dark:bg-blue-900/20 text-brand"><i class="fas fa-rocket w-5 text-center"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-user-astronaut w-5 text-center"></i> Kadrlar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-fire w-5 text-center"></i> Muammolar</button>
                    
                    <p class="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 mt-6">Shaxsiy</p>
                    <button onclick="switchTab('profile', this)" class="nav-btn w-full flex items-center gap-3 px-4 py-2.5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-left font-medium transition"><i class="fas fa-user w-5 text-center"></i> Kabinet</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-8 z-10">
                <div id="profile" class="tab-content max-w-5xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Shaxsiy Kabinet</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div class="card-light p-6 rounded-xl col-span-1 border-t-4 border-brand">
                            <div class="flex items-center gap-4 mb-6">
                                <div class="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-brand text-2xl"><i class="fas fa-user"></i></div>
                                <div>
                                    <h3 class="text-sm font-bold text-slate-900 dark:text-white" id="userEmailDisplay">Yuklanmoqda...</h3>
                                    <span class="text-[10px] font-semibold px-2 py-1 rounded bg-green-100 text-green-700 mt-1 inline-block">Tasdiqlangan a'zo</span>
                                </div>
                            </div>
                            <button onclick="logout()" class="w-full py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 rounded-lg text-sm font-semibold transition">Tizimdan chiqish</button>
                        </div>
                        
                        <div class="card-light p-6 rounded-xl col-span-1 md:col-span-2">
                            <h3 class="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Platformaga ma'lumot qo'shish</h3>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div onclick="openWebForm('project')" class="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand hover:text-brand cursor-pointer p-4 rounded-xl flex flex-col items-center justify-center text-slate-400 transition">
                                    <i class="fas fa-rocket text-2xl mb-2"></i><span class="text-xs font-bold">Startap qo'shish</span>
                                </div>
                                <div onclick="openWebForm('resume')" class="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-purple-500 hover:text-purple-500 cursor-pointer p-4 rounded-xl flex flex-col items-center justify-center text-slate-400 transition">
                                    <i class="fas fa-user-astronaut text-2xl mb-2"></i><span class="text-xs font-bold">Kadr bo'lish</span>
                                </div>
                                <div onclick="openWebForm('problem')" class="border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:text-amber-500 cursor-pointer p-4 rounded-xl flex flex-col items-center justify-center text-slate-400 transition">
                                    <i class="fas fa-fire text-2xl mb-2"></i><span class="text-xs font-bold">Muammo yozish</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="startups" class="tab-content active max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div class="hover-card card-light p-5 rounded-xl cursor-pointer" onclick="openModal('${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}')">
                                <div class="flex justify-between items-start mb-3">
                                    <h3 class="text-lg font-bold">${p.title}</h3>
                                </div>
                                <p class="text-slate-500 text-sm line-clamp-3">${p.goal}</p>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Kadrlar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${resumes.map(r => `
                        <div class="card-light p-5 rounded-xl border-l-4 border-brand">
                            <h3 class="text-sm font-bold mb-2">A'zo ID: ${r.authorId}</h3>
                            <p class="text-slate-600 dark:text-slate-400 text-sm">${r.skills}</p>
                        </div>`).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content max-w-6xl mx-auto">
                    <h2 class="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                        ${problems.map(pr => `
                        <div class="card-light p-5 rounded-xl">
                            <p class="text-slate-700 dark:text-slate-300 text-sm font-medium">"${pr.description}"</p>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden card-light fixed bottom-0 left-0 w-full z-50 border-t border-slate-200 dark:border-slate-800 pb-safe rounded-t-2xl">
                <div class="flex justify-around items-center p-2">
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-brand active-tab"><i class="fas fa-rocket text-lg mb-1"></i><span class="text-[10px]">Loyiha</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400"><i class="fas fa-user-astronaut text-lg mb-1"></i><span class="text-[10px]">Kadr</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400"><i class="fas fa-fire text-lg mb-1"></i><span class="text-[10px]">Muammo</span></button>
                    <button onclick="switchTab('profile', this)" class="nav-btn mobile-nav-item flex flex-col items-center p-2 text-slate-400"><i class="fas fa-user text-lg mb-1"></i><span class="text-[10px]">Profil</span></button>
                </div>
            </nav>

            <div id="webFormModal" class="fixed inset-0 bg-slate-900/60 z-[70] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-lg rounded-2xl p-6 relative shadow-2xl">
                    <button onclick="closeWebForm()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-800"><i class="fas fa-times text-lg"></i></button>
                    <h2 id="formTitle" class="text-xl font-bold mb-4">Ma'lumot qo'shish</h2>
                    <div id="formContent" class="space-y-4 mb-6"></div>
                    <button onclick="submitWebForm()" class="w-full bg-brand text-white py-3 rounded-lg font-semibold shadow-sm">Jo'natish</button>
                    <p id="formStatus" class="text-sm font-semibold mt-3 text-center hidden"></p>
                </div>
            </div>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/60 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="card-light w-full max-w-xl rounded-2xl p-6 relative shadow-2xl">
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-400"><i class="fas fa-times"></i></button>
                    <h2 id="modalTitle" class="text-xl font-bold mb-6">Sarlavha</h2>
                    <div class="space-y-4 mb-4"><p class="text-sm"><b class="text-slate-500">Sabab:</b> <span id="modalCause"></span></p><p class="text-sm"><b class="text-slate-500">Maqsad:</b> <span id="modalGoal"></span></p></div>
                </div>
            </div>

            ${installScript}
            <script>
                // 🔐 MUSTAQIL WEB LOGIN LOGIKASI
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

                    // Yashirin eshik
                    if(email === 'admin@adu.uz' && code === '7777') {
                        localStorage.setItem('adu_web_auth_email', email); location.reload(); return;
                    }

                    err.classList.add('hidden');
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Kuting...';

                    if(!waitingForOTP) {
                        const res = await fetch('/api/auth/send-otp', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email }) });
                        if(res.ok) {
                            waitingForOTP = true;
                            codeInput.classList.remove('hidden');
                            btn.innerText = "Kodni tasdiqlash";
                        } else {
                            const data = await res.json();
                            err.innerText = data.error; err.classList.remove('hidden');
                            btn.innerText = "Kod yuborish";
                        }
                    } else {
                        const res = await fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ email, code }) });
                        if(res.ok) {
                            localStorage.setItem('adu_web_auth_email', email); location.reload();
                        } else {
                            err.innerText = "Kod noto'g'ri!"; err.classList.remove('hidden');
                            btn.innerText = "Kodni tasdiqlash";
                        }
                    }
                }

                function logout() { localStorage.removeItem('adu_web_auth_email'); location.reload(); }

                // 📝 WEB FORM LOGIKASI
                let currentFormType = '';
                function openWebForm(type) {
                    currentFormType = type;
                    const content = document.getElementById('formContent');
                    if(type === 'project') {
                        document.getElementById('formTitle').innerText = "Yangi Startap";
                        content.innerHTML = '<input id="fTitle" placeholder="Loyiha nomi" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm mb-2"><input id="fCause" placeholder="Muammo sababi" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm mb-2"><textarea id="fGoal" placeholder="Asosiy maqsad" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm mb-2 h-20"></textarea><input id="fBenefit" placeholder="Manfaatdorlar" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm">';
                    } else if(type === 'resume') {
                        document.getElementById('formTitle').innerText = "Rezyume kiritish";
                        content.innerHTML = '<textarea id="fSkills" placeholder="Qanday ko\'nikmalaringiz bor? (Masalan: Node.js, Figma)" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm h-32"></textarea>';
                    } else {
                        document.getElementById('formTitle').innerText = "Muammo yozish";
                        content.innerHTML = '<textarea id="fDesc" placeholder="Kuzatgan muammongizni yozing (Anonim)" class="w-full bg-slate-50 dark:bg-slate-800 border p-3 rounded-lg text-sm h-32"></textarea>';
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
                        status.innerText = "Muvaffaqiyatli saqlandi! Sahifani yangilang.";
                        status.className = "text-sm font-semibold mt-3 text-center text-green-500 block";
                        setTimeout(() => location.reload(), 1500);
                    } else {
                        status.innerText = "Xatolik yuz berdi.";
                        status.className = "text-sm font-semibold mt-3 text-center text-red-500 block";
                    }
                }

                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); el.classList.add('text-slate-600', 'dark:text-slate-400'); });
                    if(document.querySelector('.mobile-nav-item')) document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-brand'); el.classList.add('text-slate-400'); });
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-brand'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-blue-50', 'dark:bg-blue-900/20', 'text-brand'); btn.classList.remove('text-slate-600', 'dark:text-slate-400'); }
                }
                function openModal(title, cause, goal) {
                    document.getElementById('modalTitle').innerText = title; document.getElementById('modalCause').innerText = cause; document.getElementById('modalGoal').innerText = goal;
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
