const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

async function viewonceCommand(sock, chatId, message) {
    const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quoted?.imageMessage;
    const quotedVideo = quoted?.videoMessage;

    if (!quoted || (!quotedImage && !quotedVideo)) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Révélation de Message Éphémère*\n\nMonsieur, veuillez répondre à un message éphémère (photo ou vidéo) avec *.viewonce* pour en révéler le contenu.\n\n> _"Alfred révèle les secrets avec la plus grande discrétion."_ 🕵️`
        }, { quoted: message });
        return;
    }

    try {
        if (quotedImage && quotedImage.viewOnce) {
            const stream = await downloadContentFromMessage(quotedImage, 'image');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.sendMessage(chatId, {
                image: buffer, fileName: 'media.jpg',
                caption: `🎩 *Alfred révèle ce message éphémère, Monsieur.*\n_Discrétion conseillée._ 🕯️${quotedImage.caption ? '\n\n' + quotedImage.caption : ''}`
            }, { quoted: message });
        } else if (quotedVideo && quotedVideo.viewOnce) {
            const stream = await downloadContentFromMessage(quotedVideo, 'video');
            let buffer = Buffer.from([]);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
            await sock.sendMessage(chatId, {
                video: buffer, fileName: 'media.mp4',
                caption: `🎩 *Alfred révèle ce message éphémère, Monsieur.*\n_Discrétion conseillée._ 🕯️${quotedVideo.caption ? '\n\n' + quotedVideo.caption : ''}`
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: '🎩 Ce message n\'est pas éphémère, Monsieur. Répondez à un message vu une seule fois.' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in viewonce command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu révéler ce contenu, Monsieur. Le message a peut-être expiré.' }, { quoted: message });
    }
}

module.exports = viewonceCommand;
