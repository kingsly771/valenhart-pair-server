const axios = require('axios');

async function tiktokCommand(sock, chatId, message, url) {
    if (!url) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Service TikTok*\n\nMonsieur, veuillez me fournir le lien TikTok à télécharger.\n\n📌 *Exemple :* *.tiktok https://vm.tiktok.com/...*\n\n> _"Alfred récupère le contenu sans filigrane, avec discrétion."_ 🕯️`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🎩 *Alfred récupère la vidéo TikTok, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const response = await axios.post('https://www.tikwm.com/api/', { url: url });
        const data = response.data;

        if (!data?.data) throw new Error('No result');

        const result = data.data;
        const videoUrl = result.play || result.wmplay;

        if (!videoUrl) throw new Error('No video URL');

        await sock.sendMessage(chatId, {
            video: { url: videoUrl },
            caption: `🎩 *Vidéo TikTok récupérée sans filigrane, Monsieur.*\n📹 _${result.title || 'TikTok Video'}_\n\n> _Mis à disposition par Alfred — Maison VALENHART._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in tiktok command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La récupération de la vidéo TikTok a rencontré un contretemps, Monsieur. Vérifiez le lien et réessayez.' }, { quoted: message });
    }
}

module.exports = tiktokCommand;
