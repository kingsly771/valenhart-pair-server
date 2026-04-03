const fetch = require('node-fetch');
const { tmpdir } = require('os');
const { join } = require('path');
const { writeFile } = require('fs/promises');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function attpCommand(sock, chatId, message, text) {
    if (!text) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Sticker Animé*\n\nMonsieur, veuillez me fournir le texte pour créer le sticker animé.\n\n📌 *Exemple :* *.attp VALENHART MD*\n\n> _"Alfred anime vos mots avec finesse."_ ✨`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: '🎩 *Alfred crée votre sticker animé, Monsieur...*\n_Un instant de patience._' }, { quoted: message });

        const url = `https://api.xteam.xyz/attp?text=${encodeURIComponent(text)}&apikey=d90a9e986e18778b`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('API failed');

        const buffer = await res.buffer();
        const tmpPath = join(tmpdir(), `attp_${Date.now()}.gif`);
        const webpPath = join(tmpdir(), `attp_${Date.now()}.webp`);
        await writeFile(tmpPath, buffer);

        await execAsync(`ffmpeg -i "${tmpPath}" -vcodec libwebp -filter:v fps=15 -compression_level 5 -loop 0 "${webpPath}"`);

        await sock.sendMessage(chatId, { sticker: await require('fs').promises.readFile(webpPath) }, { quoted: message });
        try { require('fs').unlinkSync(tmpPath); require('fs').unlinkSync(webpPath); } catch {}
    } catch (error) {
        console.error('Error in attp command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La création du sticker animé a rencontré un contretemps, Monsieur. Essayez avec un texte plus court.' }, { quoted: message });
    }
}

module.exports = attpCommand;
