const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { uploadImage } = require('../lib/uploadImage');

async function getQuotedOrOwnImageUrl(sock, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (quoted?.imageMessage) {
        const stream = await downloadContentFromMessage(quoted.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return await uploadImage(Buffer.concat(chunks));
    }
    if (message.message?.imageMessage) {
        const stream = await downloadContentFromMessage(message.message.imageMessage, 'image');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return await uploadImage(Buffer.concat(chunks));
    }
    return null;
}

async function removebgCommand(sock, chatId, message) {
    try {
        const imageUrl = await getQuotedOrOwnImageUrl(sock, message);
        if (!imageUrl) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez envoyer ou répondre à une image pour que Alfred en supprime l\'arrière-plan.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred supprime l\'arrière-plan de l\'image, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const response = await axios.get(`https://api.remove.bg/v1.0/removebg`, {
            params: { image_url: imageUrl, size: 'auto' },
            headers: { 'X-Api-Key': 'DEMO' },
            responseType: 'arraybuffer'
        });

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 *Arrière-plan supprimé avec succès, Monsieur.*\n\n> _"Alfred soigne chaque détail de la présentation."_ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in removebg command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La suppression d\'arrière-plan a rencontré un contretemps, Monsieur. Vérifiez que l\'image est claire et réessayez.' }, { quoted: message });
    }
}

module.exports = { name: 'removebg', alias: ['rmbg', 'nobg'], execute: removebgCommand };
