const fetch = require('node-fetch');

async function dareCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://shizoapi.onrender.com/api/texts/dare?apikey=shizo`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous lance ce défi, Monsieur :*\n\n⚔️ _"${json.result}"_\n\n> _Un gentleman ne recule jamais devant un défi. À vous de jouer._ 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in dare command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Le défi du moment tarde à venir, Monsieur. Un instant de patience, je vous prie.'
        }, { quoted: message });
    }
}

module.exports = { dareCommand };
