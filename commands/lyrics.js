const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle, message) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Archives Musicales*\n\nMonsieur, veuillez me préciser le titre de l'œuvre musicale.\n\n📌 *Exemple :* *.lyrics My Way*\n\n> _"La musique est l'âme des grandes demeures."_ — Alfred 🎩`
        }, { quoted: message });
        return;
    }

    try {
        const res = await fetch(`https://lyricsapi.fly.dev/api/lyrics?q=${encodeURIComponent(songTitle)}`);
        if (!res.ok) throw await res.text();
        const data = await res.json();
        const lyrics = data?.result?.lyrics;

        if (!lyrics) {
            await sock.sendMessage(chatId, {
                text: `🎩 Alfred est au regret, Monsieur — les paroles de *"${songTitle}"* ne figurent pas dans les archives de la Maison VALENHART.`
            }, { quoted: message });
            return;
        }

        const maxChars = 4096;
        const output = lyrics.length > maxChars ? lyrics.slice(0, maxChars - 3) + '...' : lyrics;

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vous présente les paroles, Monsieur :*\n🎵 *${songTitle}*\n${'─'.repeat(30)}\n\n${output}\n\n> _"La musique civilise l'âme."_ — Alfred 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, { text: `🎩 Alfred est au regret — les archives musicales sont momentanément inaccessibles pour *"${songTitle}"*, Monsieur.` }, { quoted: message });
    }
}

module.exports = { lyricsCommand };
