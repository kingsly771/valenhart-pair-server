const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

async function settingsCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Ces informations sont réservées au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        const settingsText =
            `🎩 *Registre des Paramètres — Maison VALENHART*\n` +
            `${'─'.repeat(34)}\n\n` +
            `🤖 *Majordome :* Alfred\n` +
            `🏛️ *Maison :* ${settings.botName}\n` +
            `👑 *Maître :* ${settings.botOwner}\n` +
            `📱 *Numéro :* ${settings.ownerNumber}\n` +
            `📋 *Version :* v${settings.version}\n` +
            `🔐 *Mode :* ${settings.commandMode}\n` +
            `💬 *Max Messages :* ${settings.maxStoreMessages}\n\n` +
            `📜 *Description :*\n_${settings.description}_\n\n` +
            `> _"Alfred maintient les registres avec la plus grande rigueur."_ 🕯️`;

        await sock.sendMessage(chatId, { text: settingsText }, { quoted: message });
    } catch (error) {
        console.error('Error in settings command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Les registres sont momentanément inaccessibles, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = settingsCommand;
