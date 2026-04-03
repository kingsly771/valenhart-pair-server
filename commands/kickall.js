const isAdmin = require('../lib/isAdmin');

async function kickallCommand(sock, chatId, senderId, message) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur, Monsieur.' }, { quoted: message });
        return;
    }
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Réservé aux administrateurs, Monsieur.' }, { quoted: message });
        return;
    }

    const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
    const meta = await sock.groupMetadata(chatId);
    const targets = meta.participants
        .filter(p => !p.admin && p.id !== botId)
        .map(p => p.id);

    if (!targets.length) {
        await sock.sendMessage(chatId, { text: '🎩 Aucun membre à exclure, Monsieur.' }, { quoted: message });
        return;
    }

    await sock.sendMessage(chatId, {
        text: `🎩 *Alfred vide la salle, Monsieur...*\n_${targets.length} membre(s) à la porte._ 🚪`
    }, { quoted: message });

    await sock.groupParticipantsUpdate(chatId, targets, 'remove').catch(() => {});

    await sock.sendMessage(chatId, {
        text: `🎩 *Fait, Monsieur.* ${targets.length} personne(s) ont quitté la Maison VALENHART.\n> _Alfred a tenu la porte._ ✨`
    });
}

module.exports = kickallCommand;
