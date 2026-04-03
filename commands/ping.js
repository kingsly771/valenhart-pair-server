const settings = require('../settings.js');

function formatTime(seconds) {
    const d = Math.floor(seconds / 86400); seconds %= 86400;
    const h = Math.floor(seconds / 3600); seconds %= 3600;
    const m = Math.floor(seconds / 60); s = Math.floor(seconds % 60);
    let t = '';
    if (d > 0) t += `${d}j `;
    if (h > 0) t += `${h}h `;
    if (m > 0) t += `${m}m `;
    t += `${s}s`;
    return t.trim();
}

async function pingCommand(sock, chatId, message) {
    try {
        const start = Date.now();
        await sock.sendMessage(chatId, { text: '...' }, { quoted: message });
        const ping = Math.round((Date.now() - start) / 2);

        await sock.sendMessage(chatId, {
            text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  🎩  *RAPPORT DE SITUATION*
┗━━━━━━━━━━━━━━━━━━━━━━━┛

╭────〔 ⚡ PERFORMANCE 〕────
│ 🏓 *Réactivité :* ${ping} ms
│ ⏱️ *En service :* ${formatTime(process.uptime())}
│ 📋 *Version :* v${settings.version}
╰──────────────────────────

┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃ _"Je suis à votre disposition,_
┃  _comme toujours, Monsieur."_
┃              — *Alfred* 🫡
┗━━━━━━━━━━━━━━━━━━━━━━━┛`
        }, { quoted: message });
    } catch (error) {
        await sock.sendMessage(chatId, { text: '🎩 Alfred est présent, Monsieur. Un contretemps technique, c\'est tout.' }, { quoted: message });
    }
}

module.exports = pingCommand;
