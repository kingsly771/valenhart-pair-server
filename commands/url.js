const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');
const { UploadFileUgu, TelegraPh } = require('../lib/uploader');

async function getMediaBufferAndExt(message) {
    const m = message.message || {};
    const types = [
        { key: 'imageMessage', type: 'image', ext: '.jpg' },
        { key: 'videoMessage', type: 'video', ext: '.mp4' },
        { key: 'audioMessage', type: 'audio', ext: '.mp3' },
        { key: 'stickerMessage', type: 'sticker', ext: '.webp' },
    ];
    for (const { key, type, ext } of types) {
        if (m[key]) {
            const stream = await downloadContentFromMessage(m[key], type);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            return { buffer: Buffer.concat(chunks), ext };
        }
    }
    return null;
}

async function urlCommand(sock, chatId, message) {
    try {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Service d'Hébergement*\n\nRépondez à un fichier (image, vidéo, audio, sticker) avec *.url* pour obtenir son lien.\n\n> _"Alfred archive et met à disposition, Monsieur."_ 🕯️`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred téléverse le fichier, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const result = await getMediaBufferAndExt({ message: quoted });
        if (!result) {
            await sock.sendMessage(chatId, { text: '🎩 Aucun fichier compatible n\'a été détecté, Monsieur. Répondez à une image, vidéo, audio ou sticker.' }, { quoted: message });
            return;
        }

        const { buffer, ext } = result;
        let url;
        try { url = await TelegraPh(buffer, ext); }
        catch { url = await UploadFileUgu(buffer, ext); }

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous fournit le lien, Monsieur :*\n\n🔗 ${url}\n\n> _"Archivé et mis à disposition par la Maison VALENHART."_ ✨`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in url command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le service d\'hébergement rencontre un contretemps, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = urlCommand;
