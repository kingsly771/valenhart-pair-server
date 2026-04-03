const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const response = await axios.get('https://icanhazdadjoke.com/', {
            headers: { Accept: 'application/json' }
        });
        const joke = response.data.joke;
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous soumet cette anecdote, Monsieur :*\n\n_"${joke}"_\n\n> _Comme disait mon ancien maître : l'humour est le vernis de la dignité._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error fetching joke:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 Je suis au regret, Monsieur — la plaisanterie du jour m\'échappe momentanément. Mes excuses les plus sincères.'
        }, { quoted: message });
    }
};
