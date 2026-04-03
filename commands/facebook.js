const axios = require('axios');

async function facebookCommand(sock, chatId, message, url) {
    if (!url) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Service Facebook*\n\nMonsieur, veuillez me fournir le lien Facebook à télécharger.\n\n📌 *Exemple :* *.facebook https://www.facebook.com/...*\n\n> _"Alfred récupère discrètement le contenu, Monsieur."_ 🕯️`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🎩 *Alfred récupère le contenu Facebook, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const response = await axios.get(`https://api.giftedtech.co.ke/api/download/facebook?apikey=gifted&url=${encodeURIComponent(url)}`);
        const data = response.data;

        if (!data?.success || !data?.result) throw new Error('No result');

        const result = data.result;
        if (result.hd_video || result.sd_video) {
            await sock.sendMessage(chatId, {
                video: { url: result.hd_video || result.sd_video },
                caption: `🎩 *Contenu Facebook récupéré par Alfred, Monsieur.* ✨`
            }, { quoted: message });
        } else {
            throw new Error('No media found');
        }
    } catch (error) {
        console.error('Error in facebook command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La récupération du contenu Facebook a rencontré un contretemps, Monsieur. Vérifiez que le lien est public.' }, { quoted: message });
    }
}

module.exports = facebookCommand;
