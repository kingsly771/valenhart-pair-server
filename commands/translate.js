const axios = require('axios');

async function translateCommand(sock, chatId, message, text, targetLang) {
    if (!text || !targetLang) {
        await sock.sendMessage(chatId, {
            text: '🎩 Monsieur, permettez-moi de vous rappeler la syntaxe :\n*.trt [langue] [texte]*\n\nExemple : *.trt fr Hello World*'
        }, { quoted: message });
        return;
    }
    try {
        const response = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=auto|${targetLang}`);
        const translation = response.data.responseData.translatedText;
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous présente la traduction, Monsieur :*\n\n🌐 *Langue cible :* ${targetLang.toUpperCase()}\n\n📜 _"${translation}"_\n\n> _La communication est le fondement de toute bonne relation._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in translate command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le service de traduction est temporairement indisponible, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = translateCommand;
