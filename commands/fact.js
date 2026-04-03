const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en');
        const fact = response.data.text;
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous présente un fait digne d'intérêt, Monsieur :*\n\n📜 _"${fact}"_\n\n> _La connaissance, c'est le seul bien que l'on ne peut vous dérober._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error fetching fact:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Pardonnez-moi, Monsieur — les archives de la Maison VALENHART sont temporairement inaccessibles. Veuillez réessayer.'
        }, { quoted: message });
    }
};
