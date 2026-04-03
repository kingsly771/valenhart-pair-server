const fetch = require('node-fetch');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

async function emojimixCommand(sock, chatId, msg) {
    try {
        const text = msg.message?.conversation?.trim() || msg.message?.extendedTextMessage?.text?.trim() || '';
        const args = text.split(' ').slice(1);

        if (!args[0] || !text.includes('+')) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Fusion d'Émojis*\n\n` +
                      `Séparez deux émojis avec un *+* pour les fusionner.\n\n` +
                      `📌 *Exemple :* *.emojimix* 😎+🥰\n\n` +
                      `> _"Une touche d'originalité, digne de la Maison VALENHART."_ 🕯️`
            }, { quoted: msg });
            return;
        }

        let [emoji1, emoji2] = args[0].split('+').map(e => e.trim());
        const url = `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            await sock.sendMessage(chatId, { text: '🎩 Alfred est désolé, Monsieur — ces émojis ne peuvent être fusionnés. Essayez une autre combinaison.' }, { quoted: msg });
            return;
        }

        const imageUrl = data.results[0].url;
        const tmpDir = path.join(process.cwd(), 'tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        const tempFile = path.join(tmpDir, `temp_${Date.now()}.png`).replace(/\\/g, '/');
        const outputFile = path.join(tmpDir, `sticker_${Date.now()}.webp`).replace(/\\/g, '/');

        const imageResponse = await fetch(imageUrl);
        fs.writeFileSync(tempFile, await imageResponse.buffer());

        await new Promise((resolve, reject) => {
            exec(`ffmpeg -i "${tempFile}" -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" "${outputFile}"`, (error) => {
                if (error) reject(error); else resolve();
            });
        });

        if (!fs.existsSync(outputFile)) throw new Error('Sticker creation failed');

        await sock.sendMessage(chatId, { sticker: fs.readFileSync(outputFile) }, { quoted: msg });

        try { fs.unlinkSync(tempFile); fs.unlinkSync(outputFile); } catch {}
    } catch (error) {
        console.error('Error in emojimix command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La fusion d\'émojis a rencontré un contretemps, Monsieur. Veuillez réessayer avec des émojis valides.' }, { quoted: msg });
    }
}

module.exports = emojimixCommand;
