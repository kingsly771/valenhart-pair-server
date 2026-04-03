const axios = require('axios');

async function instagramCommand(sock, chatId, message, url) {
    if (!url) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Service Instagram*\n\nMonsieur, veuillez me fournir le lien Instagram à télécharger.\n\n📌 *Exemple :* *.instagram https://www.instagram.com/p/...*\n\n> _"Alfred récupère discrètement le contenu souhaité."_ 🕯️`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🎩 *Alfred récupère le contenu Instagram, Monsieur...*\n_Un instant de patience._' }, { quoted: message });

        const response = await axios.get(`https://api.giftedtech.co.ke/api/download/instagramdl?apikey=gifted&url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (!data?.success || !data?.result) {
            throw new Error('No result from API');
        }

        const result = data.result;
        // GiftedTech returns an array of media items
        const items = Array.isArray(result) ? result : [result];
        const first = items[0];

        if (first?.type === 'video' || first?.url?.includes('.mp4')) {
            await sock.sendMessage(chatId, {
                video: { url: first.url },
                caption: `🎩 *Contenu Instagram récupéré par Alfred, Monsieur.* ✨`
            }, { quoted: message });
        } else if (first?.url) {
            await sock.sendMessage(chatId, {
                image: { url: first.url },
                caption: `🎩 *Contenu Instagram récupéré par Alfred, Monsieur.* ✨`
            }, { quoted: message });
        } else {
            throw new Error('No media found');
        }
    } catch (error) {
        console.error('Error in instagram command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La récupération du contenu Instagram a rencontré un contretemps, Monsieur. Vérifiez que le lien est public.' }, { quoted: message });
    }
}

module.exports = instagramCommand;
