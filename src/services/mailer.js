const nodemailer = require('nodemailer');

async function sendOTP(email, code) {
    // 🛠 TEST REJIMI: Agar Railway'da pochta sozlanmagan bo'lsa, xato bermaydi
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[TEST MODE] ${email} ga yuborilgan kod: ${code}`);
        return true; 
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const mailOptions = {
        from: `"ADU Startup Hub" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Tizimga kirish uchun tasdiqlash kodi',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #3b82f6; text-align: center;">ADU Startup Hub</h2>
                <p style="font-size: 16px;">Assalomu alaykum!</p>
                <p style="font-size: 16px;">Platformaga kirish uchun sizning bir martalik tasdiqlash kodingiz (OTP):</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; background: #f3f4f6; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${code}</span>
                </div>
                <p style="font-size: 14px; color: #666;">Ushbu kodni hech kimga bermang. Kod 5 daqiqa davomida amal qiladi.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Pochta yuborishda xato:", error);
        return false;
    }
}

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString(); 
}

module.exports = { sendOTP, generateOTP };
