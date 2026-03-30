// Taqiqlangan so'zlar bazasi (o'zaklar va ommabop so'kinishlar)
// Bu yerdagi so'zlar matn ichida qanday kelishidan qat'i nazar filtrlanadi.
const badWords = [
    "jallab", "jalab", "qanjiq", "xaromi", "haromi", "padar", "qotox", "qotoq", 
    "sik", "dalbayob", "blyad", "suka", "xyu", "pidar", "gandon", "foxisha", 
    "fahiwa", "kot", "naxuy", "nahuy", "chmo", "shlyuxa", "jopa", "tvar"
];

/**
 * Matn ichida axloqsiz so'zlar bor-yo'qligini tekshiradi.
 * @param {string} text - Tekshiriluvchi matn
 * @returns {boolean} - Agar axloqsiz so'z bo'lsa true, aks holda false qaytaradi
 */
function containsProfanity(text) {
    if (!text) return false;
    
    // Barcha so'zlarni kichik harfga o'tkazib, bo'shliqlarni tozalaymiz
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
    
    // Baza ichidagi har bir so'z matnda qatnashganini tekshirish
    return badWords.some(word => normalizedText.includes(word));
}

module.exports = { containsProfanity };
