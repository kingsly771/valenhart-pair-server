const isAdmin = require('../lib/isAdmin');

async function demoteCommand(sock, chatId, mentionedJids, message) {
    try {
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande ne peut être exécutée qu\'au sein d\'un groupe, Monsieur.' }, { quoted: message });
            return;
        }
        try {
            const adminStatus = await isAdmin(sock, chatId, message.key.participant || message.key.remoteJid);
            if (!adminStatus.isBotAdmin) {
                await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour procéder à cette rétrogradation, Monsieur.' }, { quoted: message });
                return;
            }
            if (!adminStatus.isSenderAdmin) {
                await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent rétrograder un membre, Monsieur.' }, { quoted: message });
                return;
            }
        } catch (e) {
            await sock.sendMessage(chatId, { text: '🎩 Veuillez vous assurer que je suis bien administrateur de ce groupe, Monsieur.' }, { quoted: message });
            return;
        }

        let userToDemote = [];
        if (mentionedJids && mentionedJids.length > 0) {
            userToDemote = mentionedJids;
        } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
            userToDemote = [message.message.extendedTextMessage.contextInfo.participant];
        }
        if (userToDemote.length === 0) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez désigner la personne dont vous souhaitez révoquer le rang.' }, { quoted: message });
            return;
        }

        await new Promise(r => setTimeout(r, 1000));
        await sock.groupParticipantsUpdate(chatId, userToDemote, 'demote');
        const usernames = userToDemote.map(jid => `@${jid.split('@')[0]}`);
        const senderNum = (message.key.participant || message.key.remoteJid).split('@')[0];
        await sock.sendMessage(chatId, {
            text: `🎩 *Révocation de rang — Maison VALENHART*\n\n` +
                  `👤 ${usernames.join(', ')} ${userToDemote.length > 1 ? 'ont été rétrogradés' : 'a été rétrogradé'}.\n` +
                  `🫡 *Ordonné par :* @${senderNum}\n` +
                  `📅 *Date :* ${new Date().toLocaleString('fr-FR')}\n\n` +
                  `> _"Chaque rang se mérite par la conduite, non par le titre."_ — Alfred 🎩`,
            mentions: [...userToDemote, message.key.participant || message.key.remoteJid]
        }, { quoted: message });
    } catch (error) {
        console.error('Error in demote command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La rétrogradation n\'a pu être effectuée, Monsieur. Vérifiez mes privilèges.' }, { quoted: message });
    }
}

async function handleDemotionEvent(sock, groupId, participants, author) {
    try {
        if (!Array.isArray(participants) || participants.length === 0) return;
        await new Promise(r => setTimeout(r, 1000));
        const demoted = participants.map(jid => `@${(typeof jid === 'string' ? jid : jid.id).split('@')[0]}`);
        let mentionList = participants.map(jid => typeof jid === 'string' ? jid : jid.id);
        let demotedBy = 'Décision interne';
        if (author && author.length > 0) {
            const authorJid = typeof author === 'string' ? author : author.id;
            demotedBy = `@${authorJid.split('@')[0]}`;
            mentionList.push(authorJid);
        }
        await sock.sendMessage(groupId, {
            text: `🎩 *Révocation de rang — Maison VALENHART*\n\n👤 ${demoted.join(', ')} ${participants.length > 1 ? 'ont été rétrogradés' : 'a été rétrogradé'}.\n🫡 *Par :* ${demotedBy}\n📅 *Date :* ${new Date().toLocaleString('fr-FR')}`,
            mentions: mentionList
        });
    } catch (error) { console.error('Error handling demotion event:', error); }
}

module.exports = { demoteCommand, handleDemotionEvent };
