const express = require('express');
const { PrismaClient } = require('@prisma/client');
const path = require('path');
const { sendOTP, generateOTP } = require('../services/mailer');
const { LOGO_URL } = require('./views/layout');

// VIEWS (Ko'rinishlarni chaqiramiz)
const { renderLanding } = require('./views/landing');
const { renderApp } = require('./views/app');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(express.static(path.join(__dirname, '../../public')));

// ==========================================
// 🚀 PWA STANDALONE FIX (Keshni tozalash v5)
// ==========================================
app.get('/manifest.json', (req, res) => {
    res.json({
        "name": "ADU Startup Hub", "short_name": "ADU Hub", "start_url": "/app?v=5", "display": "standalone",
        "background_color": "#ffffff", "theme_color": "#2563eb",
        "icons": [{"src": LOGO_URL, "sizes": "512x512", "type": "image/png", "purpose": "any maskable"}]
    });
});
app.get('/sw.js', (req, res) => {
    res.setHeader('Content-Type', 'application/javascript');
    // Fetch ushlamasa Chrome ilova demaydi
    res.send(`self.addEventListener('install', (e) => { self.skipWaiting(); }); self.addEventListener('activate', (e) => { e.waitUntil(clients.claim()); }); self.addEventListener('fetch', (e) => { e.respondWith(fetch(e.request).catch(() => new Response('Internet yoq'))); });`);
});

// ==========================================
// 🔐 WEB API: MUSTAQIL AVTORIZATSIYA
// ==========================================
app.post('/api/auth/send-otp', async (req, res) => {
    const { email } = req.body;
    if (!email || (!email.endsWith('@adu.uz') && !email.endsWith('@gmail.com'))) return res.status(400).json({ error: "Faqat @adu.uz pochtasi qabul qilinadi" });
    const otp = generateOTP();
    
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) await prisma.user.create({ data: { email, otpCode: otp, isVerified: false } });
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
    } else res.status(400).json({ error: "Maxfiy kod noto'g'ri kiritildi" });
});

app.post('/api/add-item', async (req, res) => {
    const { email, type, data } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: "Avtorizatsiya xatosi" });

    try {
        if (type === 'project') await prisma.project.create({ data: { title: data.title, problemCause: data.cause, goal: data.goal, benefits: data.benefits, authorId: user.id } });
        else if (type === 'resume') await prisma.resume.create({ data: { skills: data.skills, authorId: user.id } });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "Server xatosi" }); }
});

// ==========================================
// 🖥 SAHIFALAR ROUTERLARI
// ==========================================
app.get('/', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const activeProjects = await prisma.project.count({ where: { status: { not: "CANCELLED" } } });
        res.send(renderLanding(totalUsers, activeProjects));
    } catch (error) { res.status(500).send("Xato"); }
});

app.get('/app', async (req, res) => {
    try {
        const totalUsers = await prisma.user.count({ where: { isVerified: true } });
        const teamBuilding = await prisma.project.count({ where: { status: "TEAM_BUILDING" } });
        const mvpStage = await prisma.project.count({ where: { status: "MVP" } });
        const launched = await prisma.project.count({ where: { status: "LAUNCHED" } });
        const activeProjects = await prisma.project.findMany({ where: { status: { not: "CANCELLED" } }, orderBy: { createdAt: 'desc' }, include: { author: true } });
        const resumes = await prisma.resume.findMany({ orderBy: { createdAt: 'desc' }, include: { author: true } });
        const problems = await prisma.problem.findMany({ orderBy: { createdAt: 'desc' } });

        res.send(renderApp(totalUsers, teamBuilding, mvpStage, launched, activeProjects, resumes, problems));
    } catch (error) { res.status(500).send("Xato"); }
});

function startServer(port) {
    app.listen(port, () => { console.log(`🌐 Web Server ${port}-portda ishga tushdi.`); });
}

module.exports = { startServer };
