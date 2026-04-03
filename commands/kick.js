const isAdmin = require('../lib/isAdmin');

async function kickCommand(sock, chatId, senderId, mentionedJids, message) {
    const isOwner = message.key.fromMe;
    if (!isOwner) {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, il me faudrait les prérogatives d\'administrateur pour procéder à ce renvoi.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette décision appartient aux administrateurs de la demeure. Votre rang ne vous y autorise pas, Monsieur.' }, { quoted: message });
            return;
        }
    }

    let usersToKick = [];
    if (mentionedJids && mentionedJids.length > 0) {
        usersToKick = mentionedJids;
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        usersToKick = [message.message.extendedTextMessage.contextInfo.participant];
    }

    if (usersToKick.length === 0) {
        await sock.sendMessage(chatId, { text: '🎩 Permettez-moi de vous demander, Monsieur, qui doit quitter cette demeure. Veuillez mentionner la personne concernée.' }, { quoted: message });
        return;
    }

    const botId = sock.user?.id || '';
    const botPhoneNumber = botId.includes(':') ? botId.split(':')[0] : (botId.includes('@') ? botId.split('@')[0] : botId);
    const botIdFormatted = botPhoneNumber + '@s.whatsapp.net';
    const botLid = sock.user?.lid || '';
    const botLidNumeric = botLid.includes(':') ? botLid.split(':')[0] : (botLid.includes('@') ? botLid.split('@')[0] : botLid);

    const metadata = await sock.groupMetadata(chatId);
    const participants = metadata.participants || [];

    const isTryingToKickBot = usersToKick.some(userId => {
        const userPhoneNumber = userId.includes(':') ? userId.split(':')[0] : (userId.includes('@') ? userId.split('@')[0] : userId);
        if (userId === botId || userId === botIdFormatted || userPhoneNumber === botPhoneNumber) return true;
        return participants.some(p => {
            const pId = p.id ? p.id.split('@')[0] : '';
            const isThisBot = pId === botPhoneNumber || p.id === botId || p.id === botIdFormatted;
            if (isThisBot) return userId === p.id || userPhoneNumber === pId;
            return false;
        });
    });

    if (isTryingToKickBot) {
        await sock.sendMessage(chatId, { text: '🎩 Je me permets de faire observer, Monsieur, qu\'un majordome ne peut s\'expulser lui-même de la demeure. Cela manquerait singulièrement de dignité. 🎩' }, { quoted: message });
        return;
    }

    try {
        await sock.groupParticipantsUpdate(chatId, usersToKick, 'remove');
        const usernames = usersToKick.map(jid => `@${jid.split('@')[0]}`);
        await sock.sendMessage(chatId, {
            text: `🎩 Comme vous le souhaitez, Monsieur.\n${usernames.join(', ')} ${usersToKick.length > 1 ? 'ont été' : 'a été'} reconduit${usersToKick.length > 1 ? 's' : ''} à la porte de la Maison VALENHART.\n_Alfred a veillé à ce que la sortie soit... sans esclandre._ ✨`,
            mentions: usersToKick
        }, { quoted: message });
    } catch (error) {
        console.error('Error in kick command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Je regrette, Monsieur, de ne pouvoir procéder à ce renvoi dans l\'immédiat. Vérifiez mes privilèges d\'administrateur.' }, { quoted: message });
    }
}

module.exports = kickCommand;
