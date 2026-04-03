const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');

async function setProfilePicture(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: msg });
            return;
        }

        const quotedMessage = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage) {
            await sock.sendMessage(chatId, { text: '🎩 Veuillez répondre à une image avec *.setpp*, Monsieur. Alfred se chargera du reste.' }, { quoted: msg });
            return;
        }

        const imageMessage = quotedMessage.imageMessage || quotedMessage.stickerMessage;
        if (!imageMessage) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, seules les images et les stickers sont acceptés pour la photo de profil.' }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred met à jour la photo de profil de la Maison, Monsieur...*\n_Un instant de patience._' }, { quoted: msg });

        const type = quotedMessage.imageMessage ? 'image' : 'sticker';
        const stream = await downloadContentFromMessage(imageMessage, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

        await sock.updateProfilePicture(sock.user.id, buffer);
        await sock.sendMessage(chatId, { text: '🎩 *La photo de profil de la Maison VALENHART a été mise à jour, Monsieur.*\n> _Alfred veille à la présentation irréprochable de la Maison._ ✨' }, { quoted: msg });
    } catch (error) {
        console.error('Error in setpp command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La mise à jour de la photo de profil a rencontré un contretemps, Monsieur. Mes excuses.' }, { quoted: msg });
    }
}

module.exports = setProfilePicture;
