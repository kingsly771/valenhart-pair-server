const fs = require('fs');
const ANTICALL_PATH = './data/anticall.json';

function readState() {
    try {
        if (!fs.existsSync(ANTICALL_PATH)) return { enabled: false };
        return { enabled: !!JSON.parse(fs.readFileSync(ANTICALL_PATH, 'utf8') || '{}').enabled };
    } catch { return { enabled: false }; }
}
function writeState(enabled) {
    try {
        if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
        fs.writeFileSync(ANTICALL_PATH, JSON.stringify({ enabled: !!enabled }, null, 2));
    } catch {}
}

async function anticallCommand(sock, chatId, message, args) {
    const state = readState();
    const sub = (args || '').trim().toLowerCase();

    if (!sub || !['on', 'off', 'status'].includes(sub)) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Protection Anti-Appels*\n\n` +
                  `*.anticall on* — Activer le blocage automatique des appels\n` +
                  `*.anticall off* — Désactiver la protection\n` +
                  `*.anticall status* — Consulter l'état actuel\n\n` +
                  `> _"La Maison VALENHART protège sa tranquillité, Monsieur."_ 🕯️`
        }, { quoted: message });
        return;
    }

    if (sub === 'status') {
        await sock.sendMessage(chatId, {
            text: `🎩 *État de la protection Anti-Appels :*\n\n${state.enabled ? '✅ *Activée* — Alfred filtre les appels entrants.' : '❌ *Désactivée* — Les appels ne sont pas filtrés.'}\n\n> _Alfred veille sur la sérénité de la Maison._ 🎩`
        }, { quoted: message });
        return;
    }

    const enable = sub === 'on';
    writeState(enable);
    await sock.sendMessage(chatId, {
        text: `🎩 Très bien, Monsieur. La protection Anti-Appels est désormais *${enable ? 'activée ✅' : 'désactivée ❌'}*.\n> _Alfred assure l'ordre et la tranquillité de la Maison VALENHART._ 🎩`
    }, { quoted: message });
}

module.exports = { anticallCommand, readState };
