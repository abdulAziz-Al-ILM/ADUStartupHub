const { Telegraf, Markup } = require('telegraf');
const { PrismaClient } = require('@prisma/client');
const { sendOTP, generateOTP } = require('../services/mailer');
const { aiModerationCheck } = require('../services/ai');

const prisma = new PrismaClient();
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const userState = new Map();

const mainMenu = Markup.keyboard([
    ['🚀 Loyiha yaratish', '🤝 Rezyume'],
    ['❗ Muammo (Anonim)', '⚙️ Loyihalarim'],
    ['📊 Kabinet']
]).resize();

// 🆔 ID bilish buyrug'i
bot.command('myid', (ctx) => {
    ctx.reply(`Sizning Telegram ID raqamingiz:\n\`${ctx.from.id}\``, { parse_mode: 'Markdown' });
});

bot.start(async (ctx) => {
    const telegramId = ctx.from.id;
    const payload = ctx.startPayload; // Deep linking (Saytdan kelsa)

    try {
        let user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        
        if (!user) {
            user = await prisma.user.create({ data: { telegramId: BigInt(telegramId), username: ctx.from.username || "yashirin" } });
        }
        
        if (user.isBanned) return ctx.reply("⛔️ Akkauntingiz bloklangan.");

        // 👑 ADMIN BYPASS
        const adminId = process.env.ADMIN_TELEGRAM_ID ? process.env.ADMIN_TELEGRAM_ID.trim() : "";
        if (telegramId.toString() === adminId && !user.isVerified) {
            user = await prisma.user.update({
                where: { telegramId: BigInt(telegramId) },
                data: { isVerified: true, email: "admin@adu.uz" } 
            });
            await ctx.reply("👑 *Admin Rejimi:* Tizimga to'g'ridan-to'g'ri kiritildingiz!", { parse_mode: 'Markdown' });
        }

        if (!user.isVerified) {
            userState.set(telegramId, { step: 'AWAITING_EMAIL' });
            return ctx.reply("🎓 *ADU Startup Hub yopiq platformasiga xush kelibsiz!*\n\nTizimdan foydalanish uchun universitetingiz tomonidan berilgan korporativ pochtangizni (@adu.uz) kiriting.\n\n_Masalan: talaba@adu.uz_", { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
        }

        // 🔗 SAYTDAN KELGAN SO'ROVLAR (DEEP LINKING)
        if (payload && payload.startsWith('req_')) {
            const projectId = parseInt(payload.split('_')[1]);
            const project = await prisma.project.findUnique({ where: { id: projectId } });
            if (!project) return ctx.reply("Loyiha topilmadi.", mainMenu);

            // 🚫 INSTAGRAM 1X QOIDASI (Faqat bitta ariza)
            const existingReq = await prisma.request.findFirst({ where: { projectId, applicantId: user.id } });
            if (existingReq) return ctx.reply("⚠️ Siz ushbu jamoaga allaqachon so'rov yuborgansiz. Iltimos, loyiha asoschisi javobini kuting.", mainMenu);

            userState.set(telegramId, { step: 'AWAITING_REQUEST_TEXT', targetProjectId: projectId });
            return ctx.reply(`🎯 *${project.title}* jamoasiga qo'shilmoqchimisiz?\n\nIltimos, nima ish qila olishingizni va tajribangizni qisqacha yozib yuboring:`, { parse_mode: 'Markdown', ...Markup.removeKeyboard() });
        }

        ctx.reply("🌟 Asosiy menyu:", mainMenu);
        userState.delete(telegramId);
    } catch (error) {
        console.error(error);
        ctx.reply("Tizimda xatolik.");
    }
});

// ==========================================
// TUGMALAR MANTIQI
// ==========================================
bot.hears('🚀 Loyiha yaratish', (ctx) => {
    userState.set(ctx.from.id, { step: 'PROJ_TITLE' });
    ctx.reply("🚀 Yangi Startap!\nLoyihangizning jozibador va qisqacha nomini yozing:", Markup.removeKeyboard());
});

bot.hears('🤝 Rezyume', (ctx) => {
    userState.set(ctx.from.id, { step: 'RESUME' });
    ctx.reply("👨‍💻 Ko'nikmalaringizni bozorga chiqaring:\nNimalarni bilasiz? Qaysi texnologiyalarda ishlaysiz?", Markup.removeKeyboard());
});

bot.hears('❗ Muammo (Anonim)', (ctx) => {
    userState.set(ctx.from.id, { step: 'PROBLEM' });
    ctx.reply("💡 Qanday muammo bor?\n*(Eslatma: Bu e'lon saytda anonim tarzda chiqadi, ismingiz ko'rsatilmaydi)*", Markup.removeKeyboard());
});

bot.hears('📊 Kabinet', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    ctx.reply(`📊 *Shaxsiy Kabinet*\n\n🆔 ID: \`${user.telegramId}\`\n📧 Pochta: ${user.email}\n⚠️ Qoidabuzarlik: ${user.reportCount}/2`, { parse_mode: 'Markdown' });
});

bot.hears('⚙️ Loyihalarim', async (ctx) => {
    const user = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    const myProjects = await prisma.project.findMany({ where: { authorId: user.id, status: { not: "CANCELLED" } } });

    if (myProjects.length === 0) return ctx.reply("Sizda hozircha faol loyihalar yo'q.");

    let replyText = "⚙️ *Loyihalaringizni boshqaring:*\nQaysi loyihaning holatini o'zgartirmoqchisiz?";
    const buttons = myProjects.map(p => [Markup.button.callback(`${p.title} (${p.status})`, `manage_${p.id}`)]);
    ctx.reply(replyText, { parse_mode: 'Markdown', ...Markup.inlineKeyboard(buttons) });
});

// Loyiha boshqaruvi harakatlari
bot.action(/manage_(\d+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    ctx.answerCbQuery();
    ctx.editMessageText("Harakatni tanlang:", Markup.inlineKeyboard([
        [Markup.button.callback("🚀 MVP Bosqichiga o'tdi", `status_${projectId}_MVP`)],
        [Markup.button.callback("🌟 Ishga Tushdi (Launched)", `status_${projectId}_LAUNCHED`)],
        [Markup.button.callback("❌ Loyihani bekor qilish", `cancel_${projectId}`)]
    ]));
});

bot.action(/status_(\d+)_([A-Z]+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    const newStatus = ctx.match[2];
    await prisma.project.update({ where: { id: projectId }, data: { status: newStatus } });
    ctx.answerCbQuery("Holat yangilandi!");
    ctx.editMessageText(`✅ Loyiha holati *${newStatus}* ga o'zgartirildi. Saytdagi statistika yangilandi.`, { parse_mode: 'Markdown' });
});

bot.action(/cancel_(\d+)/, async (ctx) => {
    const projectId = parseInt(ctx.match[1]);
    userState.set(ctx.from.id, { step: 'AWAITING_CANCEL_REASON', targetProjectId: projectId });
    ctx.answerCbQuery();
    ctx.editMessageText("⚠️ Loyiha nega bekor bo'ldi? Tahlil uchun qisqacha sababini yozing:");
});


// ==========================================
// MATNLAR ZANJIRI (TEXT PROCESSOR)
// ==========================================
bot.on('text', async (ctx) => {
    const telegramId = ctx.from.id;
    const text = ctx.message.text.trim();
    const state = userState.get(telegramId);

    if (!state) return;

    // 1. POCHTA VA OTP MANTIQI
    if (state.step === 'AWAITING_EMAIL' || state.step === 'AWAITING_OTP') {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });
        
        if (state.step === 'AWAITING_EMAIL') {
            if (!text.toLowerCase().endsWith('@adu.uz') && !text.toLowerCase().endsWith('@gmail.com')) {
                return ctx.reply("❌ Faqat @adu.uz korporativ pochtasi qabul qilinadi:");
            }
            const existing = await prisma.user.findFirst({ where: { email: text.toLowerCase(), isVerified: true } });
            if (existing && existing.telegramId !== BigInt(telegramId)) return ctx.reply("⚠️ Bu pochta band!");

            const msg = await ctx.reply("⏳ Kuting...");
            const otp = generateOTP();
            const isSent = await sendOTP(text.toLowerCase(), otp);

            if (isSent) {
                await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { email: text.toLowerCase(), otpCode: otp } });
                userState.set(telegramId, { step: 'AWAITING_OTP' });
                await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, `✅ Tasdiqlash kodi *${text}* ga yuborildi.\nKodni kiriting:`, { parse_mode: 'Markdown' });
            } else {
                await ctx.telegram.editMessageText(ctx.chat.id, msg.message_id, null, "❌ Pochta xizmatida xatolik.");
            }
        } 
        else if (state.step === 'AWAITING_OTP') {
            if (user.otpCode === text) {
                await prisma.user.update({ where: { telegramId: BigInt(telegramId) }, data: { isVerified: true, otpCode: null } });
                userState.delete(telegramId);
                ctx.reply("🎉 Muvaffaqiyatli tasdiqlandingiz!", mainMenu);
            } else {
                ctx.reply("❌ Kod xato. Qayta urinib ko'ring yoki /start bosing.");
            }
        }
        return;
    }

    // 2. SUN'IY INTELLEKT FILTRI (Faqat ruxsat etilganlar uchun ishlaydi)
    const loadingMsg = await ctx.reply("⏳ AI tahlili...");
    const isClean = await aiModerationCheck(text);
    
    if (!isClean) {
        userState.delete(telegramId);
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "⛔️ Matnda axloqsizlik yoki yot veb-havola aniqlandi. So'rov bekor qilindi.");
        return ctx.reply("Menyuga qaytdingiz:", mainMenu);
    }

    try {
        const user = await prisma.user.findUnique({ where: { telegramId: BigInt(telegramId) } });

        // 📝 LOYIHA SHABLONI ZANJIRI
        if (state.step === 'PROJ_TITLE') {
            userState.set(telegramId, { step: 'PROJ_CAUSE', data: { title: text } });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Qabul qilindi. \n\nUshbu loyihani yaratishga qanday *Muammo (Sabab)* turtki bo'ldi?", { parse_mode: 'Markdown' });
        } 
        else if (state.step === 'PROJ_CAUSE') {
            state.data.cause = text;
            userState.set(telegramId, { step: 'PROJ_GOAL', data: state.data });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Qabul. \n\nLoyihaning *Asosiy maqsadi* nima?", { parse_mode: 'Markdown' });
        }
        else if (state.step === 'PROJ_GOAL') {
            state.data.goal = text;
            userState.set(telegramId, { step: 'PROJ_BENEFIT', data: state.data });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Qabul. \n\nBundan kim va qancha *Manfaat (Foyda)* ko'radi?", { parse_mode: 'Markdown' });
        }
        else if (state.step === 'PROJ_BENEFIT') {
            state.data.benefits = text;
            userState.set(telegramId, { step: 'PROJ_SOLUTION', data: state.data });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "🔒 Qabul. \n\nBuni qanday amalga oshirasiz? *Yechim siri qanday?* \n_(Xavotir olmang, bu qism ommaga ko'rinmaydi. Faqat jamoangizga qo'shilganlar o'qiy oladi)_", { parse_mode: 'Markdown' });
        }
        else if (state.step === 'PROJ_SOLUTION') {
            state.data.solution = text;
            userState.set(telegramId, { step: 'PROJ_LINK', data: state.data });
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Eng so'nggi qadam: \n\nJamoangiz bilan suhbatlashish uchun ochilgan *Telegram guruh havolasini* yuboring (Masalan: t.me/guruh_nomi):", { parse_mode: 'Markdown' });
        }
        else if (state.step === 'PROJ_LINK') {
            await prisma.project.create({ 
                data: { 
                    title: state.data.title, problemCause: state.data.cause, goal: state.data.goal,
                    benefits: state.data.benefits, hiddenSolution: state.data.solution,
                    groupLink: text, authorId: user.id 
                } 
            });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "🎉 Tabriklaymiz! Loyihangiz platformaga joylandi.");
            ctx.reply("Asosiy menyu", mainMenu);
        }

        // BOSHQA FUNKSIYALAR
        else if (state.step === 'AWAITING_REQUEST_TEXT' && state.targetProjectId) {
            try {
                const project = await prisma.project.findUnique({ where: { id: state.targetProjectId }, include: { author: true } });
                await prisma.request.create({ data: { coverLetter: text, projectId: state.targetProjectId, applicantId: user.id } });
                bot.telegram.sendMessage(Number(project.author.telegramId), `🔔 *Yangi nomzod!*\nLoyiha: ${project.title}\nNomzod: @${ctx.from.username || 'yashirin'}\nXati: ${text}\nGuruh: ${project.groupLink}`, { parse_mode: 'Markdown' });
                await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Arizangiz loyiha muallifiga yuborildi!");
            } catch (e) {
                if (e.code === 'P2002') await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "⚠️ Arizangiz allaqachon yuborilgan."); 
            }
            userState.delete(telegramId);
            ctx.reply("Menyu", mainMenu);
        }
        else if (state.step === 'AWAITING_CANCEL_REASON' && state.targetProjectId) {
            await prisma.project.update({ where: { id: state.targetProjectId }, data: { status: "CANCELLED", cancelReason: text } });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Loyiha bekor qilindi va sababi statistikaga yozildi.");
            ctx.reply("Menyu", mainMenu);
        }
        else if (state.step === 'PROBLEM' || state.step === 'RESUME') {
            if (state.step === 'PROBLEM') await prisma.problem.create({ data: { description: text, authorId: user.id } });
            if (state.step === 'RESUME') await prisma.resume.create({ data: { skills: text, authorId: user.id } });
            userState.delete(telegramId);
            await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "✅ Qabul qilindi!");
            ctx.reply("Menyu", mainMenu);
        }
    } catch (error) {
        console.error(error);
        await ctx.telegram.editMessageText(ctx.chat.id, loadingMsg.message_id, null, "❌ Xatolik yuz berdi.");
    }
});

function startBot() {
    bot.launch().then(() => console.log("🚀 Telegram Bot ishga tushdi (Modul)"));
    process.once('SIGINT', () => bot.stop('SIGINT'));
    process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

module.exports = { startBot };
