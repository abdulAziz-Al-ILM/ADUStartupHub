const badWords = [
    "jallab", "jalab", "qanjiq", "xaromi", "haromi", "padar", "qotox", "qotoq", 
    "sik", "dalbayob", "blyad", "suka", "xyu", "pidar", "gandon", "foxisha", 
    "fahiwa", "kot", "naxuy", "nahuy", "chmo", "shlyuxa", "jopa", "tvar"
];

// Havolalarni (Link) aniqlovchi Regex
const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.[a-zA-Z]{2,})/g;

function containsProfanityOrLink(text) {
    if (!text) return { isBad: false, reason: null };
    
    // 1. Linklarni tekshirish (Taqiqlangan)
    if (urlRegex.test(text)) {
        return { isBad: true, reason: "LINK" };
    }

    // 2. Axloqsizlikni tekshirish
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
    const hasBadWord = badWords.some(word => normalizedText.includes(word));
    
    if (hasBadWord) {
        return { isBad: true, reason: "PROFANITY" };
    }

    return { isBad: false, reason: null };
}

module.exports = { containsProfanityOrLink };
