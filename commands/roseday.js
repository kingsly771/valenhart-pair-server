const fetch = require('node-fetch');

async function rosedayCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://api.princetechn.com/api/fun/roseday?apikey=prince`);
        if (!res.ok) throw await res.text();
        const json = await res.json();
        await sock.sendMessage(chatId, {
            text: `🌹 *Alfred vous offre cette pensée florale, Monsieur :*\n\n_"${json.result}"_\n\n> _Une rose de la Maison VALENHART, avec la bienveillance d'Alfred._ 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in roseday command:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 La roseraie de la Maison VALENHART est silencieuse pour le moment, Monsieur. Mes excuses.'
        }, { quoted: message });
    }
}

module.exports = { rosedayCommand };
