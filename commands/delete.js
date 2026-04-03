const isAdmin = require('../lib/isAdmin');
const store = require('../lib/lightweight_store');

async function deleteCommand(sock, chatId, message, senderId) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour supprimer des messages, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent ordonner la suppression de messages, Monsieur.' }, { quoted: message });
            return;
        }

        const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
        const parts = text.trim().split(/\s+/);
        let countArg = null;
        if (parts.length > 1) {
            const n = parseInt(parts[1], 10);
            if (!isNaN(n) && n > 0) countArg = Math.min(n, 50);
        }

        const quoted = message.message?.extendedTextMessage?.contextInfo;
        if (quoted?.stanzaId) {
            await sock.sendMessage(chatId, { delete: { remoteJid: chatId, fromMe: false, id: quoted.stanzaId, participant: quoted.participant } });
            await sock.sendMessage(chatId, { text: '🎩 *Message supprimé, Monsieur.* ✨\n> _Alfred maintient l\'ordre et la sérénité de la Maison._' }, { quoted: message });
        } else if (countArg) {
            await sock.sendMessage(chatId, { text: `🎩 *Alfred supprime les ${countArg} derniers messages, Monsieur...*\n_Un instant._` }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Suppression de Messages*\n\n` +
                      `*.delete* (en répondant) — Supprimer un message précis\n` +
                      `*.delete <nombre>* — Supprimer les N derniers messages\n\n` +
                      `> _"Alfred efface discrètement ce qui doit l'être."_ 🎩`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in delete command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La suppression a rencontré un contretemps, Monsieur. Vérifiez mes privilèges d\'administrateur.' }, { quoted: message });
    }
}

module.exports = deleteCommand;
