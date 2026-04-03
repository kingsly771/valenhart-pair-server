const fs = require('fs');
const path = require('path');
const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const webp = require('node-webpmux');
const crypto = require('crypto');

async function takeCommand(sock, chatId, message, args) {
    try {
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMessage?.stickerMessage) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Renommage de Sticker*\n\nMonsieur, veuillez répondre à un sticker avec *.take <nom du pack>*\n\n📌 *Exemple :* *.take Maison VALENHART*\n\n> _"Alfred appose le cachet de la Maison."_ 🎩`
            }, { quoted: message });
            return;
        }

        const packname = args.join(' ') || 'Alfred — Maison VALENHART';
        const author = 'Maison VALENHART';

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const stickerPath = path.join(tmpDir, `sticker_${crypto.randomBytes(4).toString('hex')}.webp`);
        const stream = await downloadMediaMessage(quotedMessage, 'sticker', {}, { reuploadRequest: sock.updateMediaMessage });
        fs.writeFileSync(stickerPath, stream);

        const img = new webp.Image();
        await img.load(stickerPath);
        const json = { 'sticker-pack-id': crypto.randomBytes(8).toString('hex'), 'sticker-pack-name': packname, 'sticker-pack-publisher': author, 'emojis': ['🎩'] };
        const exifAttr = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00]);
        const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
        const exif = Buffer.concat([exifAttr, jsonBuf]);
        exif.writeUIntLE(jsonBuf.length, 14, 4);
        img.exif = exif;
        await img.save(stickerPath);

        await sock.sendMessage(chatId, {
            sticker: fs.readFileSync(stickerPath),
        }, { quoted: message });

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred a apposé le cachet de la Maison, Monsieur :*\n\n📦 *Pack :* ${packname}\n✏️ *Auteur :* ${author}\n\n> _"Le sceau de la Maison VALENHART est désormais gravé."_ ✨`
        }, { quoted: message });

        try { fs.unlinkSync(stickerPath); } catch {}
    } catch (error) {
        console.error('Error in take command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu apposer le cachet sur ce sticker, Monsieur. Assurez-vous de répondre à un sticker valide.' }, { quoted: message });
    }
}

module.exports = takeCommand;
