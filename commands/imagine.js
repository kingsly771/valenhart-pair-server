const axios = require('axios');
const { fetchBuffer } = require('../lib/myfunc');

function enhancePrompt(prompt) {
    const enhancers = ['high quality', 'detailed', 'masterpiece', 'ultra realistic', '4k', 'cinematic lighting', 'sharp focus'];
    const selected = enhancers.sort(() => Math.random() - 0.5).slice(0, 3);
    return `${prompt}, ${selected.join(', ')}`;
}

async function imagineCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation?.trim() || message.message?.extendedTextMessage?.text?.trim() || '';
        const imagePrompt = text.slice(8).trim();

        if (!imagePrompt) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Atelier d'Imagerie*\n\nMonsieur, veuillez me fournir une description de l'image souhaitée.\n\n📌 *Exemple :* *.imagine un château dans les nuages au coucher de soleil*\n\n> _"L'imagination est le plus noble des arts."_ — Alfred 🎩`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });
        await sock.sendMessage(chatId, { text: `🎩 *Alfred commande l'œuvre à l'atelier, Monsieur...*\n_Quelques instants, je vous prie._` }, { quoted: message });

        const enhanced = enhancePrompt(imagePrompt);
        const response = await axios.get(`https://shizoapi.onrender.com/api/ai/imagine?apikey=shizo&query=${encodeURIComponent(enhanced)}`, { responseType: 'arraybuffer' });

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 *Alfred vous présente cette œuvre, Monsieur :*\n📜 _"${imagePrompt}"_\n\n> _Peint à la demande de la Maison VALENHART._ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in imagine command:', error);
        await sock.sendMessage(chatId, { text: '🎩 L\'atelier rencontre un contretemps, Monsieur. L\'œuvre sera disponible lors de votre prochaine demande.' }, { quoted: message });
    }
}

module.exports = imagineCommand;
