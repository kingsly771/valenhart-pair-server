const fetch = require('node-fetch');

module.exports = async function quoteCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/quotes?apikey=shizo`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous offre cette citation, Monsieur :*\n\n🕯️ _"${json.result}"_\n\n> _La sagesse, comme le bon vin, mérite d'être savourée lentement._ 🍷`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in quote command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 La bibliothèque de la Maison VALENHART est momentanément fermée, Monsieur. Je vous prie de réessayer.'
        }, { quoted: message });
    }
};
