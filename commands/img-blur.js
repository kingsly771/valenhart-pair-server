const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function imgBlurCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = message.message?.imageMessage || quoted?.imageMessage;

        if (!imageMsg) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Floutage d'Image*\n\nMonsieur, veuillez envoyer ou répondre à une image.\n\n> _"Alfred protège la discrétion avec élégance."_ 🕯️`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred floute l\'image, Monsieur...*\n_Un instant de patience._' }, { quoted: message });

        const stream = await downloadContentFromMessage(imageMsg, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);
        const base64 = buffer.toString('base64');

        const response = await axios.get(
            `https://some-random-api.com/canvas/filter/blur?avatar=data:image/jpeg;base64,${base64}`,
            { responseType: 'arraybuffer' }
        );

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 *Alfred a flouté l'image, Monsieur.*\n\n> _"La discrétion est une vertu de la Maison VALENHART."_ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in img-blur command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le floutage a rencontré un contretemps, Monsieur. Veuillez réessayer.' }, { quoted: message });
    }
}

module.exports = imgBlurCommand;
