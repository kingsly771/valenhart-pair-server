const axios = require('axios');

async function soraCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation?.trim() || message.message?.extendedTextMessage?.text?.trim() || '';
        const prompt = text.split(' ').slice(1).join(' ').trim();

        if (!prompt) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Atelier Vidéo IA*\n\nMonsieur, veuillez me décrire la vidéo souhaitée.\n\n📌 *Exemple :* *.sora un château dans les nuages au coucher de soleil*\n\n> _"L'imagination au service de la Maison VALENHART."_ — Alfred 🎬`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🎬', key: message.key } });
        await sock.sendMessage(chatId, { text: `🎩 *Alfred commande la création vidéo à l'atelier, Monsieur...*\n_📽️ "${prompt}"_\n_Cela peut prendre quelques instants, je vous prie._` }, { quoted: message });

        const response = await axios.get(`https://shizoapi.onrender.com/api/ai/sora?apikey=shizo&query=${encodeURIComponent(prompt)}`, { responseType: 'arraybuffer' });

        await sock.sendMessage(chatId, {
            video: Buffer.from(response.data),
            caption: `🎩 *Alfred vous présente cette création vidéo, Monsieur :*\n📽️ _"${prompt}"_\n\n> _Créé à la demande de la Maison VALENHART._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in sora command:', error);
        await sock.sendMessage(chatId, { text: '🎩 L\'atelier vidéo rencontre un contretemps, Monsieur. Veuillez réessayer dans un instant.' }, { quoted: message });
    }
}

module.exports = soraCommand;
