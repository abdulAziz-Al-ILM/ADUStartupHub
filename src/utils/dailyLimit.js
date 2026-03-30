const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Foydalanuvchining kunlik limitini tekshiradi va sarflaydi.
 * @param {bigint} telegramId - Foydalanuvchining Telegram ID si
 * @returns {object} - { allowed: boolean, remaining: number, reason: string }
 */
async function consumeDailyLimit(telegramId) {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    
    if (!user) {
        return { allowed: false, reason: "USER_NOT_FOUND" };
    }

    if (user.isBanned) {
        return { allowed: false, reason: "BANNED" };
    }

    const now = new Date();
    const lastAction = new Date(user.lastActionDate);
    
    // Bugungi kun ekanligini tekshirish
    const isSameDay = 
        now.getFullYear() === lastAction.getFullYear() &&
        now.getMonth() === lastAction.getMonth() &&
        now.getDate() === lastAction.getDate();

    if (!isSameDay) {
        // Yangi kun keldi, limitni yangilab, 1-urinishni yozib qo'yamiz
        await prisma.user.update({
            where: { telegramId },
            data: { dailyActions: 1, lastActionDate: now }
        });
        return { allowed: true, remaining: 2 };
    }

    // Agar limit tugagan bo'lsa
    if (user.dailyActions >= 3) {
        return { allowed: false, reason: "LIMIT_REACHED" };
    }

    // Limit bor bo'lsa, urinishni bittaga oshiramiz
    const updatedUser = await prisma.user.update({
        where: { telegramId },
        data: { dailyActions: user.dailyActions + 1, lastActionDate: now }
    });

    return { allowed: true, remaining: 3 - updatedUser.dailyActions };
}

module.exports = { consumeDailyLimit };
