const isAdmin = require('../lib/isAdmin');

async function tagNotAdminCommand(sock, chatId, senderId, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour accomplir cette tâche, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux administrateurs de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants || [];
        const nonAdmins = participants.filter(p => !p.admin).map(p => p.id);

        if (nonAdmins.length === 0) {
            await sock.sendMessage(chatId, { text: '🎩 Tous les membres de cette demeure sont administrateurs, Monsieur. Alfred n\'a personne à convoquer.' }, { quoted: message });
            return;
        }

        const mentions = nonAdmins.map(jid => `@${jid.split('@')[0]}`).join(' ');
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred convoque les membres non-administrateurs de la Maison VALENHART :*\n\n${mentions}\n\n> _"Votre présence est requise."_ — Alfred 🎩`,
            mentions: nonAdmins
        }, { quoted: message });
    } catch (error) {
        console.error('Error in tagnotadmin command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché d\'effectuer cette convocation, Monsieur.' }, { quoted: message });
    }
}

module.exports = tagNotAdminCommand;
