const fetch = require('node-fetch');

async function handleSsCommand(sock, chatId, message, match) {
    if (!match) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Outil de Capture d'Écran*\n\n` +
                  `*.ss <url>* — Capturer une page web\n\n` +
                  `📌 *Exemple :* *.ss https://google.com*\n\n` +
                  `> _"Alfred documente le web avec la plus grande rigueur."_ 🕯️`
        }, { quoted: message });
        return;
    }

    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
        await sock.sendMessage(chatId, { text: `🎩 *Alfred capture la page, Monsieur...*\n🌐 _${match.trim()}_` }, { quoted: message });

        const url = match.trim();
        const apiUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&access_key=free`;
        const response = await fetch(`https://shot.screenshotapi.net/screenshot?token=free&url=${encodeURIComponent(url)}&output=image&file_type=png&wait_for_event=load`);

        if (!response.ok) throw new Error('Screenshot API failed');

        const buffer = await response.buffer();
        await sock.sendMessage(chatId, {
            image: buffer,
            caption: `🎩 *Capture effectuée, Monsieur :*\n🌐 _${url}_\n\n> _Alfred documente pour la Maison VALENHART._ 📜`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in ss command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La capture de la page a rencontré un contretemps, Monsieur. Vérifiez l\'URL et réessayez.' }, { quoted: message });
    }
}

module.exports = handleSsCommand;
