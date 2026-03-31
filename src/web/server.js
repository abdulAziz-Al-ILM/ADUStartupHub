const express = require('express');
const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// Tizim haqida tushuntirish sahifasi (Landing Page) + Dark Grid animatsiyasi
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
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;800&display=swap');
                body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #050505; color: #fff; margin: 0; overflow-x: hidden; }
                
                /* Animated Dark Grid Fon (Vercel/Stripe uslubi) */
                .grid-bg { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; z-index: -1; 
                           background-image: 
                               linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                               linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
                           background-size: 50px 50px;
                           mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
                           -webkit-mask-image: linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 100%);
                }
                .glow { position: absolute; top: -20%; left: 50%; transform: translateX(-50%); width: 80%; height: 50%; 
                        background: radial-gradient(ellipse at top, rgba(59, 130, 246, 0.3), transparent 70%); z-index: -1; }
                
                .glass { background: rgba(10, 10, 10, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
            </style>
        </head>
        <body class="min-h-screen flex flex-col">
            <div class="grid-bg"></div>
            <div class="glow"></div>

            <nav class="w-full glass fixed top-0 z-50 px-8 py-4 flex justify-between items-center border-b border-slate-800">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-[0_0_15px_rgba(59,130,246,0.5)]">
                        <i class="fas fa-rocket"></i>
                    </div>
                    <span class="text-xl font-extrabold tracking-tight">ADU Hub</span>
                </div>
                <div><span class="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20">Yopiq Beta Versiya</span></div>
            </nav>

            <main class="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-20 z-10">
                <h1 class="text-5xl md:text-7xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto tracking-tight">
                    Universitet g'oyalarini <br> <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">Bozorga aylantiramiz.</span>
                </h1>
                <p class="text-lg md:text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
                    ADU Startup Hub — bu Andijon Davlat Universitetining eng iqtidorli talabalarini, dasturchilarini va g'oya egalarini birlashtiruvchi yopiq ekotizim.
                </p>

                <div class="flex flex-wrap justify-center gap-4 mb-12">
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center">
                        <span class="text-3xl font-black text-white">${totalUsers}</span>
                        <span class="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Elita A'zolar</span>
                    </div>
                    <div class="glass px-6 py-4 rounded-2xl flex flex-col items-center">
                        <span class="text-3xl font-black text-blue-400">${activeProjects}</span>
                        <span class="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Faol Startaplar</span>
                    </div>
                </div>

                <div class="glass p-8 rounded-3xl max-w-lg w-full text-left relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                    <h3 class="text-2xl font-bold mb-2">Tizimga qo'shilish</h3>
                    <p class="text-slate-400 text-sm mb-6">Xavfsizlik va sifatni ta'minlash maqsadida platformaga faqatgina universitet tomonidan berilgan korporativ pochta (@adu.uz) orqali kirish mumkin.</p>
                    
                    <a href="https://t.me/BU_YERGA_BOT_USERNAME_YOZING" target="_blank" class="w-full flex items-center justify-center gap-3 bg-white text-black hover:bg-slate-200 transition font-bold py-4 rounded-xl">
                        <i class="fab fa-telegram text-blue-500 text-xl"></i> Telegram orqali pochtani tasdiqlash
                    </a>
                </div>
            </main>
        </body>
        </html>
        `;
        res.send(html);
    } catch (error) {
        res.status(500).send("Server xatosi");
    }
});

function startServer(port) {
    app.listen(port, () => {
        console.log(\`🌐 Web Server \${port}-portda ishga tushdi.\`);
    });
}

module.exports = { startServer };
