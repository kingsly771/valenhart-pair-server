const axios = require('axios');

module.exports = async function (sock, chatId, message) {
    try {
        const apiKey = 'dcd720a6f1914e2d9dba9790c188c08c';
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${apiKey}`);
        const articles = response.data.articles.slice(0, 5);

        let newsMessage = `🎩 *Alfred vous présente la revue de presse du jour, Monsieur :*\n${'─'.repeat(30)}\n\n`;
        articles.forEach((article, index) => {
            newsMessage += `*${index + 1}.* 📰 *${article.title}*\n_${article.description || 'Aucun résumé disponible.'}_\n\n`;
        });
        newsMessage += `> _"Un gentleman bien informé est un gentleman bien armé."_ — Alfred 🎩`;

        await sock.sendMessage(chatId, { text: newsMessage }, { quoted: message });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, {
            text: '🎩 La gazette du jour m\'échappe pour le moment, Monsieur. Veuillez réessayer dans un instant.'
        }, { quoted: message });
    }
};
