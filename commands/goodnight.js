const fetch = require('node-fetch');

async function goodnightCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/lovenight?apikey=shizo`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous souhaite une bonne nuit, Monsieur :*\n\n🕯️ _"${json.result}"_\n\n> _Que la nuit vous apporte le repos que votre rang mérite._ 🌙`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Je ne saurais vous laisser sans vous souhaiter une excellente nuit, Monsieur. Dormez bien. 🌙'
        }, { quoted: message });
    }
}

module.exports = { goodnightCommand };
