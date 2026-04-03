const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/pmblocker.json');

function loadConfig() {
    try {
        if (!fs.existsSync(CONFIG_PATH)) return { enabled: false, message: null };
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch { return { enabled: false, message: null }; }
}

function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch {}
}

async function pmblockerCommand(sock, chatId, message, args, isOwner) {
    if (!isOwner) {
        await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
        return;
    }

    const config = loadConfig();
    const sub = (args || '').trim().toLowerCase();

    if (!sub) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Gardien des Messages Privés*\n\n` +
                  `*.pmblocker on* — Activer le filtrage des MP\n` +
                  `*.pmblocker off* — Désactiver le filtrage\n` +
                  `*.pmblocker status* — État actuel\n` +
                  `*.pmblocker setmsg <texte>* — Personnaliser la réponse automatique\n\n` +
                  `> _"Alfred filtre les visites non souhaitées."_ 🎩`
        }, { quoted: message });
        return;
    }

    if (sub === 'status') {
        await sock.sendMessage(chatId, {
            text: `🎩 *État du gardien des MP :*\n\n` +
                  `${config.enabled ? '✅ *Activé*' : '❌ *Désactivé*'}\n` +
                  `📝 *Message automatique :* ${config.message || '_Message par défaut d\'Alfred_'}\n\n` +
                  `> _Alfred surveille l'entrée de la Maison._ 🕯️`
        }, { quoted: message });
        return;
    }

    if (sub === 'on') {
        config.enabled = true;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: '🎩 Le gardien des messages privés est désormais *activé*, Monsieur.\n> _Alfred filtre les visiteurs indésirables._ ✅' }, { quoted: message });
    } else if (sub === 'off') {
        config.enabled = false;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: '🎩 Le gardien des messages privés est désormais *désactivé*, Monsieur.\n> _La porte est ouverte à tous._ ❌' }, { quoted: message });
    } else if (sub.startsWith('setmsg')) {
        const newMsg = args.slice(7).trim();
        if (!newMsg) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez préciser le message automatique à utiliser.' }, { quoted: message });
            return;
        }
        config.message = newMsg;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: `🎩 *Alfred a mis à jour sa réponse automatique, Monsieur :*\n\n_"${newMsg}"_\n\n> _Toujours avec le raffinement qui convient._ ✨` }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, { text: '🎩 Commande non reconnue, Monsieur. Tapez *.pmblocker* pour consulter les options disponibles.' }, { quoted: message });
    }
}

async function handlePmBlock(sock, chatId, message, isOwner) {
    const config = loadConfig();
    if (!config.enabled || isOwner) return;
    const defaultMsg = `🎩 *Bonsoir, Monsieur.*\n\nJe suis Alfred, majordome de la Maison VALENHART.\nLes messages privés ne sont pas acceptés pour le moment.\nVeuillez rejoindre un groupe pour interagir avec la Maison.\n\n> _"La Maison VALENHART vous remercie de votre compréhension."_ 🎩`;
    await sock.sendMessage(chatId, { text: config.message || defaultMsg }, { quoted: message });
}

module.exports = { pmblockerCommand, handlePmBlock, loadConfig, readState: loadConfig };
