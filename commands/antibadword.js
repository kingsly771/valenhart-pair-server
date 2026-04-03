const { handleAntiBadwordCommand } = require('../lib/antibadword');
const isAdminHelper = require('../lib/isAdmin');

async function antibadwordCommand(sock, chatId, message, senderId, isSenderAdmin) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const match = text.split(' ').slice(1).join(' ');

        if (!match) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Protection Anti-Grossièretés*\n\n` +
                      `*.antibadword on* — Activer la protection\n` +
                      `*.antibadword off* — Désactiver\n` +
                      `*.antibadword add <mot>* — Ajouter un mot interdit\n` +
                      `*.antibadword del <mot>* — Supprimer un mot\n` +
                      `*.antibadword list* — Consulter la liste\n\n` +
                      `> _"La Maison VALENHART maintient un langage digne, Monsieur."_ 🎩`
            }, { quoted: message });
            return;
        }

        await handleAntiBadwordCommand(sock, chatId, message, match);
    } catch (error) {
        console.error('Error in antibadword command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché de traiter cette commande, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = antibadwordCommand;
