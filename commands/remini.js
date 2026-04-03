const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function reminiCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const imageMsg = message.message?.imageMessage || quoted?.imageMessage;

        if (!imageMsg) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Restauration d'Image*\n\nMonsieur, veuillez envoyer ou répondre à une image pour que j'en améliore la qualité.\n\n> _"Alfred restitue chaque image dans sa splendeur d'origine."_ ✨`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred restaure l\'image, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const stream = await downloadContentFromMessage(imageMsg, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const base64 = buffer.toString('base64');
        const response = await axios.post('https://inferenceengine.vyro.ai/enhance', {
            image: base64
        }, { responseType: 'arraybuffer' });

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 *Image restaurée avec succès, Monsieur.*\n\n> _"Alfred restitue chaque détail avec le soin qu'il mérite."_ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in remini command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La restauration de l\'image a rencontré un contretemps, Monsieur. Veuillez réessayer avec une image claire.' }, { quoted: message });
    }
}

module.exports = reminiCommand;
