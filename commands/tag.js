const isAdmin = require('../lib/isAdmin');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const fs = require('fs');
const path = require('path');

async function downloadMediaMessage(message, mediaType) {
    const stream = await downloadContentFromMessage(message, mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    const filePath = path.join(__dirname, '../temp/', `${Date.now()}.${mediaType}`);
    fs.writeFileSync(filePath, buffer);
    return filePath;
}

async function tagCommand(sock, chatId, senderId, messageText, replyMessage, message) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour tagger les membres, Monsieur.' }, { quoted: message });
        return;
    }
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Cette fonction est réservée aux administrateurs de la Maison VALENHART, Monsieur.' }, { quoted: message });
        return;
    }

    const groupMetadata = await sock.groupMetadata(chatId);
    const participants = groupMetadata.participants.map(p => p.id);
    const mentions = participants;
    const tagText = messageText || `🎩 *Alfred convoque tous les membres de la Maison VALENHART.*\n\n> _"Votre présence est requise."_ 🎩`;

    if (replyMessage) {
        const replyMsg = replyMessage.message;
        if (replyMsg?.imageMessage) {
            const filePath = await downloadMediaMessage(replyMsg.imageMessage, 'image');
            await sock.sendMessage(chatId, { image: fs.readFileSync(filePath), caption: tagText, mentions }, { quoted: message });
            fs.unlinkSync(filePath);
        } else if (replyMsg?.videoMessage) {
            const filePath = await downloadMediaMessage(replyMsg.videoMessage, 'video');
            await sock.sendMessage(chatId, { video: fs.readFileSync(filePath), caption: tagText, mentions }, { quoted: message });
            fs.unlinkSync(filePath);
        } else {
            await sock.sendMessage(chatId, { text: tagText, mentions }, { quoted: message });
        }
    } else {
        await sock.sendMessage(chatId, { text: tagText, mentions }, { quoted: message });
    }
}

module.exports = tagCommand;
