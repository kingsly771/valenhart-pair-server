const sharp = require('sharp');
const fs = require('fs');
const fsPromises = require('fs/promises');
const fse = require('fs-extra');
const path = require('path');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const tempDir = './temp';
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

const scheduleFileDeletion = (filePath) => {
    setTimeout(async () => {
        try { await fse.remove(filePath); } catch (e) { console.error('Failed to delete:', e); }
    }, 60000);
};

const convertStickerToImage = async (sock, quotedMessage, chatId, message) => {
    try {
        const stickerMessage = quotedMessage.stickerMessage;
        if (!stickerMessage) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez répondre à un sticker avec *.simage* pour le convertir en image.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred convertit le sticker en image, Monsieur...*\n_Un instant de patience._' }, { quoted: message });

        const stream = await downloadContentFromMessage(stickerMessage, 'sticker');
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        const buffer = Buffer.concat(chunks);

        const inputPath = path.join(tempDir, `sticker_${Date.now()}.webp`);
        const outputPath = path.join(tempDir, `image_${Date.now()}.png`);
        await fsPromises.writeFile(inputPath, buffer);
        await sharp(inputPath).png().toFile(outputPath);

        await sock.sendMessage(chatId, {
            image: fs.readFileSync(outputPath),
            caption: `🎩 *Alfred vous présente l'image, Monsieur.* ✨`
        }, { quoted: message });

        scheduleFileDeletion(inputPath);
        scheduleFileDeletion(outputPath);
    } catch (error) {
        console.error('Error in simage command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La conversion du sticker a rencontré un contretemps, Monsieur. Mes excuses.' }, { quoted: message });
    }
};

module.exports = { convertStickerToImage };
