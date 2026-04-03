const settings = require('../settings');
const { addSudo, removeSudo, getSudoList } = require('../lib/index');
const isOwnerOrSudo = require('../lib/isOwner');

function extractMentionedJid(message) {
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length > 0) return mentioned[0];
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const match = text.match(/\b(\d{7,15})\b/);
    if (match) return match[1] + '@s.whatsapp.net';
    return null;
}

async function sudoCommand(sock, chatId, message) {
    const senderJid = message.key.participant || message.key.remoteJid;
    const isOwner = message.key.fromMe || await isOwnerOrSudo(senderJid, sock, chatId);
    const rawText = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const args = rawText.trim().split(' ').slice(1);
    const sub = (args[0] || '').toLowerCase();

    if (!sub || !['add', 'del', 'remove', 'list'].includes(sub)) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Gestion des Lieutenants*\n\n` +
                  `*.sudo add @user* — Nommer un lieutenant\n` +
                  `*.sudo del @user* — Révoquer un lieutenant\n` +
                  `*.sudo list* — Consulter la liste\n\n` +
                  `> _"Alfred ne confie le pouvoir qu'aux plus dignes."_ 🎩`
        }, { quoted: message });
        return;
    }

    if (sub === 'list') {
        const list = await getSudoList();
        if (list.length === 0) {
            await sock.sendMessage(chatId, { text: '🎩 La Maison VALENHART n\'a aucun lieutenant enregistré pour le moment, Monsieur.' }, { quoted: message });
            return;
        }
        const formatted = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
        await sock.sendMessage(chatId, {
            text: `🎩 *Lieutenants de la Maison VALENHART :*\n\n${formatted}\n\n> _Alfred veille sur ces dignes serviteurs._ 🕯️`,
            mentions: list
        }, { quoted: message });
        return;
    }

    if (!isOwner) {
        await sock.sendMessage(chatId, { text: '🎩 Seul le Maître de la Maison peut nommer ou révoquer des lieutenants, Monsieur.' }, { quoted: message });
        return;
    }

    const targetJid = extractMentionedJid(message);
    if (!targetJid) {
        await sock.sendMessage(chatId, { text: '🎩 Veuillez mentionner ou saisir le numéro de la personne concernée, Monsieur.' }, { quoted: message });
        return;
    }

    if (sub === 'add') {
        await addSudo(targetJid);
        await sock.sendMessage(chatId, {
            text: `🎩 @${targetJid.split('@')[0]} a été nommé lieutenant de la Maison VALENHART, Monsieur.\n> _"L'honneur se mérite."_ ✨`,
            mentions: [targetJid]
        }, { quoted: message });
    } else {
        await removeSudo(targetJid);
        await sock.sendMessage(chatId, {
            text: `🎩 @${targetJid.split('@')[0]} a été révoqué de ses fonctions de lieutenant, Monsieur.\n> _Alfred a mis les registres à jour._ 📜`,
            mentions: [targetJid]
        }, { quoted: message });
    }
}

module.exports = sudoCommand;
