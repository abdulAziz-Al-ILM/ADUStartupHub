const nodemailer = require('nodemailer');

async function sendOTP(email, code) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log(`[TEST MODE] ${email} ga yuborilgan kod: ${code}`);
        return true; 
    }

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465, // Railway uchun eng ishonchli port
        secure: true, 
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        // Timeout muammosini oldini olish uchun vaqtni uzaytiramiz
        connectionTimeout: 20000, 
        greetingTimeout: 20000,
        socketTimeout: 20000
    });

    const mailOptions = {
        from: `"ADU Startup Hub" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Tizimga kirish uchun tasdiqlash kodi',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #2563eb; text-align: center;">ADU Startup Hub</h2>
                <p style="font-size: 16px;">Platformaga kirish uchun maxfiy kodingiz:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <span style="font-size: 32px; font-weight: bold; background: #f8fafc; padding: 10px 20px; border-radius: 8px; letter-spacing: 5px;">${code}</span>
                </div>
                <p style="font-size: 14px; color: #666;">Ushbu kodni hech kimga bermang.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error("Pochta yuborishda xato (Timeout yoki Blok):", error);
        return false;
    }
}

function generateOTP() {
    return Math.floor(1000 + Math.random() * 9000).toString(); 
}

module.exports = { sendOTP, generateOTP };
