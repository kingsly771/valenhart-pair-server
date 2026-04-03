const fetch = require('node-fetch');

async function shayariCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://api.princetechn.com/api/fun/shayari?apikey=prince`);
        const json = await res.json();
        const shayari = json.result || json.shayari || json.data;

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous offre cette poésie, Monsieur :*\n\n🕯️ _"${shayari}"_\n\n> _"La poésie est la plus belle des langues."_ — Alfred 📜`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in shayari command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La bibliothèque poétique de la Maison VALENHART est momentanément silencieuse, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = { shayariCommand };
