const fetch = require('node-fetch');

async function memeCommand(sock, chatId, message) {
    try {
        const response = await fetch('https://shizoapi.onrender.com/api/memes/cheems?apikey=shizo');
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('image')) {
            const imageBuffer = Buffer.from(await response.arrayBuffer());
            await sock.sendMessage(chatId, {
                image: imageBuffer,
                caption: `🎩 *Alfred vous présente ce tableau d'humour, Monsieur.*\n\n> _"Le rire, c'est le bon goût de vivre."_ — Alfred 😄`
            }, { quoted: message });
        } else {
            throw new Error('Invalid response');
        }
    } catch (error) {
        console.error('Error in meme command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La galerie d\'humour est momentanément fermée, Monsieur. Revenez dans un instant.' }, { quoted: message });
    }
}

module.exports = memeCommand;
