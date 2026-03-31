const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ==========================================
// PWA Sozlamalari (Ilova sifatida yuklash uchun)
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub",
        "short_name": "ADU Hub",
        "start_url": "/app",
        "display": "standalone",
        "background_color": "#0f172a",
        "theme_color": "#3b82f6",
        "icons": [{"src": "https://cdn-icons-png.flaticon.com/512/2040/2040946.png", "sizes": "512x512", "type": "image/png"}]
    });
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    res.send(`self.addEventListener('install', (e) => { console.log('PWA o\'rnatildi'); });`);
});

// ==========================================
// 1-XONA: LANDING PAGE (Taqdimot sahifasi)
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>ADU Startup Hub | Innovatsiyalar Markazi</title>
            <link rel="manifest" href="/manifest.json">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #050505; color: #fff; margin: 0; overflow-x: hidden; }
                .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; 
                           background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                                             linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                           background-size: 50px 50px; mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%); }
                .glow { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 80%; height: 50%; background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.3), transparent 70%); z-index: -1; }
                .glass { background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
                
                /* Ilova ichida yuklash tugmasini yashirish mantiqi */
                @media (display-mode: standalone) { .install-btn { display: none !important; } }
            </style>
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="grid-bg"></div><div class="glow"></div>
            <nav class="w-full glass fixed top-0 z-50 px-4 md:px-8 py-4 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]"><i class="fas fa-rocket"></i></div>
                    <span class="text-xl font-extrabold tracking-tight hidden md:block">ADU Hub</span>
                </div>
                <div class="flex items-center gap-3">
                    <button id="installBtnGlobal" class="install-btn flex items-center gap-2 bg-gradient-to-r from-blue-600 to-accent hover:from-blue-500 hover:to-blue-400 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-lg shadow-blue-500/20">
                        <i class="fas fa-download"></i> <span class="hidden md:inline">Ilovani o'rnatish</span>
                    </button>
                    <span class="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">Yopiq Beta</span>
                </div>
            </nav>
            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight">
                    Universitet g'oyalarini <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">ADU Startup Hub — iqtidorli talabalarni, dasturchilarni va g'oya egalarini birlashtiruvchi yopiq ekotizim.</p>
                <div class="flex flex-wrap justify-center gap-4 mb-12">
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center"><span class="text-3xl font-black text-white">${totalUsers}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Elita A'zolar</span></div>
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center"><span class="text-3xl font-black text-blue-400">${activeProjects}</span><span class="text-xs text-slate-500 uppercase font-bold mt-1">Faol Startaplar</span></div>
                </div>
                <div class="glass p-8 rounded-3xl max-w-lg w-full text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <h3 class="text-2xl font-bold mb-2">Platformaga o'tish</h3>
                    <p class="text-slate-400 text-sm mb-6">Loyihalar katalogini ko'rish va platformadan foydalanish uchun ichkariga kiring.</p>
                    <a href="/app" class="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-200 transition font-bold py-4 rounded-xl shadow-lg shadow-white/10">
                        <i class="fas fa-door-open text-blue-500 text-xl"></i> Katalog va Ilovani ochish
                    </a>
                </div>
            </main>
            <script>
                let deferredPrompt;
                window.addEventListener('beforeinstallprompt', (e) => {
                    e.preventDefault();
                    deferredPrompt = e;
                });
                document.getElementById('installBtnGlobal').addEventListener('click', async () => {
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        if (outcome === 'accepted') deferredPrompt = null;
                    } else {
                        alert("Ilova allaqachon o'rnatilgan yoki brauzeringiz avtomatik o'rnatishni qo'llab-quvvatlamaydi. Iltimos brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' tugmasini bosing.");
                    }
                });
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

// ==========================================
// 2-XONA: HAQIQIY ILOVA (Eshikning ichkarisi)
// ==========================================
app.get('/app', async (req, res) => {
    try {
        const activeProjects = await prisma.project.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' } });

        const html = `
        <!DOCTYPE html>
        <html lang="uz" class="dark">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <title>Ilova | ADU Hub</title>
            <link rel="manifest" href="/manifest.json">
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <script>
                if('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }
                tailwind.config = { darkMode: 'class', theme: { extend: { colors: { darkbg: '#0f172a', darkcard: '#1e293b', accent: '#3b82f6' } } } }
            </script>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0f172a; color: #f8fafc; overflow: hidden; }
                #canvas-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; opacity: 0.6; }
                .glass { background: rgba(30, 41, 59, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.08); }
                .tab-content { display: none; animation: fadeIn 0.3s ease-in-out; }
                .tab-content.active { display: block; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                /* Ilova ichida yuklash tugmasini yashirish mantiqi */
                @media (display-mode: standalone) { .install-btn { display: none !important; } }
            </style>
        </head>
        <body class="flex h-screen">
            <canvas id="canvas-bg"></canvas>

            <aside class="w-72 glass h-full flex flex-col hidden md:flex flex-shrink-0 z-20 shadow-2xl border-r border-slate-700/50">
                <div class="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h1 class="text-3xl font-extrabold text-white flex items-center gap-3"><i class="fas fa-layer-group text-accent"></i> ADU Hub</h1>
                </div>
                <div class="p-4 border-b border-slate-700/50">
                    <button id="installBtnAppDesktop" class="install-btn w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-accent text-white px-4 py-3 rounded-xl font-bold transition shadow-lg shadow-blue-500/20">
                        <i class="fas fa-download"></i> Ilovani kompyuterga o'rnatish
                    </button>
                </div>
                <nav class="flex-1 p-6 space-y-3">
                    <button onclick="switchTab('startups', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left font-semibold active-tab bg-slate-700/50 text-white"><i class="fas fa-rocket text-emerald-400 text-xl"></i> Startaplar</button>
                    <button onclick="switchTab('talents', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-user-astronaut text-purple-400 text-xl"></i> Mutaxassislar</button>
                    <button onclick="switchTab('problems', this)" class="nav-btn w-full flex items-center gap-4 px-5 py-4 text-slate-300 hover:bg-slate-700/50 rounded-xl text-left font-semibold"><i class="fas fa-fire text-rose-400 text-xl"></i> Muammolar</button>
                </nav>
            </aside>

            <main class="flex-1 h-full overflow-y-auto p-4 pb-24 md:p-10 z-10 relative">
                
                <div class="md:hidden flex justify-end mb-4">
                    <button id="installBtnAppMobile" class="install-btn flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-blue-500/20">
                        <i class="fas fa-download"></i> Ilovani o'rnatish
                    </button>
                </div>

                <div id="startups" class="tab-content active">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-6">Faol Loyihalar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        ${activeProjects.length > 0 ? activeProjects.map(p => `
                            <div onclick="openModal('project', '${p.id}', '${p.title.replace(/'/g, "\\'")}', '${p.problemCause.replace(/'/g, "\\'")}', '${p.goal.replace(/'/g, "\\'")}', '${p.benefits.replace(/'/g, "\\'")}')" class="glass p-6 rounded-2xl cursor-pointer hover:border-accent transition hover:-translate-y-1">
                                <span class="text-xs font-bold px-3 py-1 rounded-md mb-4 inline-block text-emerald-400 bg-emerald-500/10">Batafsil ko'rish</span>
                                <h3 class="text-2xl font-bold text-white mb-2">${p.title}</h3>
                                <p class="text-slate-400 text-sm line-clamp-2"><span class="text-slate-500 font-bold">Maqsad:</span> ${p.goal}</p>
                            </div>
                        `).join('') : '<p class="text-slate-500">Loyihalar yo\'q.</p>'}
                    </div>
                </div>

                <div id="talents" class="tab-content">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-6">Mutaxassislar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${resumes.map(r => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-purple-500">
                            <h3 class="text-xl font-bold text-white mb-2"><i class="fas fa-user-circle text-purple-400 mr-2"></i> @${r.author.username || 'Talaba'}</h3>
                            <p class="text-slate-300 text-sm">${r.skills}</p>
                        </div>`).join('')}
                    </div>
                </div>

                <div id="problems" class="tab-content">
                    <h2 class="text-3xl md:text-4xl font-extrabold text-white mb-6">Anonim Muammolar</h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        ${problems.map(pr => `
                        <div class="glass p-6 rounded-2xl border-l-4 border-l-rose-500 relative">
                            <i class="fas fa-user-secret absolute top-4 right-4 text-slate-600 text-2xl opacity-50"></i>
                            <p class="text-slate-300 mb-4 text-sm leading-relaxed">"${pr.description}"</p>
                            <span class="text-xs text-slate-500 font-bold uppercase">Muallif yashiringan</span>
                        </div>`).join('')}
                    </div>
                </div>
            </main>

            <nav class="md:hidden glass fixed bottom-0 left-0 w-full z-50 border-t border-slate-700/50 pb-safe">
                <div class="flex justify-around items-center p-4">
                    <button onclick="switchTab('startups', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-blue-500 active-tab"><i class="fas fa-rocket text-xl"></i><span class="text-[10px] font-bold">Loyihalar</span></button>
                    <button onclick="switchTab('talents', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-user-astronaut text-xl"></i><span class="text-[10px] font-bold">Iqtidorlar</span></button>
                    <button onclick="switchTab('problems', this)" class="nav-btn mobile-nav-item flex flex-col items-center gap-1 text-slate-400"><i class="fas fa-fire text-xl"></i><span class="text-[10px] font-bold">Muammolar</span></button>
                </div>
            </nav>

            <div id="detailModal" class="fixed inset-0 bg-slate-900/90 z-[60] hidden items-center justify-center p-4 backdrop-blur-sm">
                <div class="glass w-full max-w-2xl rounded-3xl border border-slate-700/50 p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto">
                    <button onclick="closeModal()" class="absolute top-4 right-4 text-slate-500 hover:text-white bg-slate-800 p-2 rounded-full"><i class="fas fa-times w-4 h-4 flex items-center justify-center"></i></button>
                    <h2 id="modalTitle" class="text-2xl md:text-3xl font-extrabold text-white mb-6 pr-8">Sarlavha</h2>
                    <div class="space-y-4 mb-8">
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-rose-400 uppercase mb-1">Muammo Sababi</h4><p id="modalCause" class="text-slate-300 text-sm">...</p></div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-emerald-400 uppercase mb-1">Asosiy Maqsad</h4><p id="modalGoal" class="text-slate-300 text-sm">...</p></div>
                        <div class="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/30"><h4 class="text-xs font-bold text-amber-400 uppercase mb-1">Manfaatdorlar</h4><p id="modalBenefits" class="text-slate-300 text-sm">...</p></div>
                    </div>
                    <a id="modalActionBtn" href="#" target="_blank" class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-accent text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30">
                        <i class="fab fa-telegram-plane text-xl"></i> Telegram orqali jamoaga qo'shilish
                    </a>
                </div>
            </div>

            <script>
                // PWA Install Logic
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
                        alert("Ilova allaqachon o'rnatilgan yoki brauzeringiz bunga ruxsat bermayapti. Iltimos brauzer menyusidan (3 nuqta) 'Ekranga qo'shish' tugmasini bosing.");
                    }
                }

                if(document.getElementById('installBtnAppDesktop')) document.getElementById('installBtnAppDesktop').addEventListener('click', handleInstall);
                if(document.getElementById('installBtnAppMobile')) document.getElementById('installBtnAppMobile').addEventListener('click', handleInstall);

                // Tab logic
                function switchTab(id, btn) {
                    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
                    document.querySelectorAll('.nav-btn').forEach(el => { el.classList.remove('active-tab', 'bg-slate-700/50', 'text-white'); el.classList.add('text-slate-300'); });
                    if(document.querySelector('.mobile-nav-item')) { document.querySelectorAll('.mobile-nav-item').forEach(el => { el.classList.remove('active-tab', 'text-blue-500'); el.classList.add('text-slate-400'); }); }
                    document.getElementById(id).classList.add('active');
                    if(btn.classList.contains('mobile-nav-item')) { btn.classList.add('active-tab', 'text-blue-500'); btn.classList.remove('text-slate-400'); } 
                    else { btn.classList.add('active-tab', 'bg-slate-700/50', 'text-white'); btn.classList.remove('text-slate-300'); }
                }
                function openModal(type, id, title, cause, goal, benefits) {
                    document.getElementById('modalTitle').innerText = title; document.getElementById('modalCause').innerText = cause;
                    document.getElementById('modalGoal').innerText = goal; document.getElementById('modalBenefits').innerText = benefits;
                    document.getElementById('modalActionBtn').href = "https://t.me/BU_YERGA_BOT_USERNAME_YOZING?start=req_" + id; 
                    document.getElementById('detailModal').classList.remove('hidden'); document.getElementById('detailModal').classList.add('flex');
                }
                function closeModal() { document.getElementById('detailModal').classList.add('hidden'); document.getElementById('detailModal').classList.remove('flex'); }

                // Orqa fon zarrachalari
                const canvas = document.getElementById('canvas-bg'); const ctx = canvas.getContext('2d');
                let width, height, particles = [];
                function resize() { width = canvas.width = window.innerWidth; height = canvas.height = window.innerHeight; }
                window.addEventListener('resize', resize); resize();
                const mouse = { x: null, y: null, radius: 150 };
                window.addEventListener('mousemove', e => { mouse.x = e.x; mouse.y = e.y; });
                class Particle {
                    constructor() { this.x = Math.random() * width; this.y = Math.random() * height; this.size = Math.random() * 2 + 0.5; this.vx = (Math.random() - 0.5) * 0.5; this.vy = (Math.random() - 0.5) * 0.5; }
                    draw() { ctx.fillStyle = 'rgba(59, 130, 246, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); }
                    update() { this.x += this.vx; this.y += this.vy; if(this.x < 0 || this.x > width) this.vx *= -1; if(this.y < 0 || this.y > height) this.vy *= -1; }
                }
                for (let i = 0; i < 80; i++) particles.push(new Particle());
                function animate() {
                    ctx.clearRect(0, 0, width, height);
                    for (let i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
                    requestAnimationFrame(animate);
                }
                animate();
            </script>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) { res.status(500).send("Server xatosi"); }
});

function startServer(port) {
    app.listen(port, () => {
        console.log(`🌐 Web Server ${port}-portda ishga tushdi.`);
    });
}

module.exports = { startServer };
