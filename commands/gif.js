const axios = require('axios');

async function gifCommand(sock, chatId, message, query) {
    try {
        if (!query) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Galerie GIF*\n\nMonsieur, veuillez préciser ce que vous recherchez.\n\n📌 *Exemple :* *.gif dancing*\n\n> _"Alfred cherche dans la galerie animée de la Maison."_ 🎬`
            }, { quoted: message });
            return;
        }

        const apiKey = 'AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ';
        const response = await axios.get(`https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=10`);
        const results = response.data?.results;

        if (!results || results.length === 0) {
            await sock.sendMessage(chatId, { text: `🎩 La galerie ne contient aucun résultat pour *"${query}"*, Monsieur. Essayez un autre terme.` }, { quoted: message });
            return;
        }

        const gif = results[Math.floor(Math.random() * results.length)];
        const gifUrl = gif.media_formats?.gif?.url || gif.url;

        await sock.sendMessage(chatId, {
            video: { url: gifUrl },
            gifPlayback: true,
            caption: `🎩 *Alfred vous présente ce GIF, Monsieur.* ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in gif command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La galerie animée est temporairement indisponible, Monsieur. Veuillez réessayer.' }, { quoted: message });
    }
}

module.exports = gifCommand;
