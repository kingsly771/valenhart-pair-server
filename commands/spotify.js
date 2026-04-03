const axios = require('axios');

async function spotifyCommand(sock, chatId, message) {
    try {
        const rawText = message.message?.conversation?.trim() || message.message?.extendedTextMessage?.text?.trim() || '';
        const used = rawText.split(/\s+/)[0] || '.spotify';
        const query = rawText.slice(used.length).trim();

        if (!query) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Service Spotify*\n\nMonsieur, veuillez me fournir un lien Spotify à télécharger.\n\n📌 *Exemple :* *.spotify https://open.spotify.com/track/...*\n\n> _"Alfred récupère la piste pour vous, avec discrétion."_ 🎵`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: `🎩 *Alfred récupère la piste Spotify, Monsieur...*\n🎵 Un instant de patience, je vous prie.` }, { quoted: message });

        const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/spotifydl?apikey=gifted&url=${encodeURIComponent(query)}`);

        if (!data?.success || !data?.result) throw new Error('No result');

        const result = data.result;
        const info = `🎩 *Alfred a préparé votre piste, Monsieur.*\n\n🎵 *${result.title}*\n⏱️ *Durée :* ${result.duration}\n\n> _Mis à disposition par Alfred — Maison VALENHART._ 🎩`;

        await sock.sendMessage(chatId, {
            image: { url: result.thumbnail },
            caption: info
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            audio: { url: result.download_url },
            mimetype: 'audio/mpeg'
        }, { quoted: message });

    } catch (error) {
        console.error('Error in spotify command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La connexion à Spotify est momentanément interrompue, Monsieur. Vérifiez que le lien est valide et réessayez.' }, { quoted: message });
    }
}

module.exports = spotifyCommand;
