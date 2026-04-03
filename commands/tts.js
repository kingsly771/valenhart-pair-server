const gTTS = require('gtts');
const fs = require('fs');
const path = require('path');

async function ttsCommand(sock, chatId, text, message, language = 'fr') {
    if (!text) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Synthèse Vocale*\n\nMonsieur, veuillez me fournir le texte à convertir en voix.\n\n📌 *Exemple :* *.tts Bonsoir, la Maison VALENHART vous accueille*\n\n> _"La voix est le plus élégant des instruments."_ — Alfred 🎙️`
        }, { quoted: message });
        return;
    }

    const fileName = `tts-${Date.now()}.mp3`;
    const filePath = path.join(__dirname, '..', 'assets', fileName);
    const gtts = new gTTS(text, language);

    gtts.save(filePath, async function (err) {
        if (err) {
            await sock.sendMessage(chatId, { text: '🎩 Alfred est au regret — la synthèse vocale a rencontré un contretemps, Monsieur.' }, { quoted: message });
            return;
        }
        await sock.sendMessage(chatId, {
            audio: { url: filePath },
            mimetype: 'audio/mpeg',
            ptt: false,
            fileName: `alfred_voice_${Date.now()}.mp3`
        }, { quoted: message });

        setTimeout(() => { try { fs.unlinkSync(filePath); } catch {} }, 30000);
    });
}

module.exports = ttsCommand;
