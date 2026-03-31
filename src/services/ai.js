const { OpenAI } = require('openai');

// Agar API kalit bo'lmasa, tizim qulamasligi uchun himoya
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

async function aiModerationCheck(text) {
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,})/g;
    const allowedRegex = /(t\.me)|(telegram\.me)/g;
    
    // Aniq linklarni ushlash
    const urls = text.match(urlRegex);
    if (urls) {
        const allAllowed = urls.every(url => allowedRegex.test(url));
        if (!allAllowed) return false;
    }

    // AI kalit yo'q bo'lsa yoki ishlamay qolsa, faqat linkni o'zini tekshirib o'tkazib yuboradi (uzilish bo'lmaydi)
    if (!openai) return true;

    try {
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "Sen o'zbek tilidagi matnlarni tekshiruvchi qat'iy va odil moderatorsan. Vazifang: Matn ichida haqorat, kamsitish yoki so'kinish borligini aniqlash. DIQQAT: 'online', 'sayt', 'internet' kabi so'zlar mutlaqo xavfsiz. Faqat haqorat bo'lsagina 'XATO' deb qaytar, aks holda 'TOZA'." },
                { role: "user", content: text }
            ],
            max_tokens: 10,
            temperature: 0.1 
        });
        
        return response.choices[0].message.content.trim().toUpperCase().includes('TOZA');
    } catch (error) {
        console.error("AI Moderatsiya xatosi:", error);
        return true; 
    }
}

module.exports = { aiModerationCheck };
