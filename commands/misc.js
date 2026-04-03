const settings = require('../settings');

async function miscCommand(sock, chatId, message, command) {
    switch (command) {
        case 'runtime':
        case 'uptime': {
            const seconds = Math.floor(process.uptime());
            const days = Math.floor(seconds / 86400);
            const hours = Math.floor((seconds % 86400) / 3600);
            const mins = Math.floor((seconds % 3600) / 60);
            const secs = seconds % 60;
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Temps de service*\n\n⏱️ En service depuis : *${days}j ${hours}h ${mins}m ${secs}s*\n\n> _"Alfred ne se repose jamais, Monsieur."_ 🫡`
            }, { quoted: message });
            break;
        }
        case 'version':
        case 'ver': {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Version de la Maison*\n\n📋 *VALENHART MD* v${settings.version}\n\n> _"Toujours à jour, comme il se doit."_ 🎩`
            }, { quoted: message });
            break;
        }
        case 'prefix': {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Préfixe de commande*\n\nLe préfixe de la Maison VALENHART est : *.*\n\n> _"Exemple : *.help* pour consulter le menu d'Alfred."_ 🎩`
            }, { quoted: message });
            break;
        }
        default: {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Commandes Diverses*\n\n*.uptime* — Temps de service d'Alfred\n*.version* — Version de la Maison\n*.prefix* — Préfixe des commandes\n\n> _"La Maison VALENHART est à votre service, Monsieur."_ 🎩`
            }, { quoted: message });
        }
    }
}

module.exports = miscCommand;
