const { isAdmin } = require('../lib/isAdmin');

async function promoteCommand(sock, chatId, mentionedJids, message) {
    let userToPromote = [];
    if (mentionedJids && mentionedJids.length > 0) {
        userToPromote = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToPromote = [message.message.extendedTextMessage.contextInfo.participant];
    }
    if (userToPromote.length === 0) {
        await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez désigner la personne dont vous souhaitez élever le rang.' }, { quoted: message });
        return;
    }
    try {
        await sock.groupParticipantsUpdate(chatId, userToPromote, 'promote');
        const promoterJid = sock.user.id;
        const usernames = userToPromote.map(jid => `@${jid.split('@')[0]}`);
        await sock.sendMessage(chatId, {
            text: `🎩 *Élévation de rang — Maison VALENHART*\n\n` +
                  `👑 ${usernames.join(', ')} ${userToPromote.length > 1 ? 'ont été élevés' : 'a été élevé'} au rang d'administrateur.\n` +
                  `🫡 *Ordonné par :* @${promoterJid.split('@')[0]}\n` +
                  `📅 *Date :* ${new Date().toLocaleString('fr-FR')}\n\n` +
                  `> _"L'honneur se mérite autant qu'il se confère."_ — Alfred 🎩`,
            mentions: [...userToPromote, promoterJid]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in promote command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La promotion n\'a pu être effectuée, Monsieur. Veuillez vérifier mes privilèges d\'administrateur.' }, { quoted: message });
    }
}

async function handlePromotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;
        const promoted = participants.map(jid => `@${(typeof jid === 'string' ? jid : jid.id).split('@')[0]}`);
        let mentionList = participants.map(jid => typeof jid === 'string' ? jid : jid.id);
        let promotedBy = 'Décision interne';
        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : author.id;
            promotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }
        await sock.sendMessage(groupId, {
            text: `🎩 *Élévation de rang — Maison VALENHART*\n\n👑 ${promoted.join(', ')} ${participants.length > 1 ? 'ont été élevés' : 'a été élevé'} au rang d'administrateur.\n🫡 *Par :* ${promotedBy}\n📅 *Date :* ${new Date().toLocaleString('fr-FR')}`,
            mentions: mentionList
        });
    } catch (error) { console.error('Error handling promotion event:', error); }
}

module.exports = { promoteCommand, handlePromotionEvent };
