const isAdmin = require('../lib/isAdmin');

async function tagAllCommand(sock, chatId, senderId, message, customText) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour convoquer tous les membres, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent convoquer toute la Maison, Monsieur.' }, { quoted: message });
            return;
        }

        const groupMetadata = await sock.groupMetadata(chatId);
        const participants = groupMetadata.participants;
        const mentions = participants.map(p => p.id);

        const tagText = customText ||
            `🎩 *Alfred convoque tous les membres de la Maison VALENHART*\n\n` +
            `${mentions.map(jid => `@${jid.split('@')[0]}`).join(' ')}\n\n` +
            `> _"Votre présence est requise."_ — Alfred 🎩`;

        await sock.sendMessage(chatId, { text: tagText, mentions }, { quoted: message });
    } catch (error) {
        console.error('Error in tagall command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La convocation générale a rencontré un contretemps, Monsieur.' }, { quoted: message });
    }
}

module.exports = tagAllCommand;
