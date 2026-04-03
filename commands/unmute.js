const isAdmin = require('../lib/isAdmin');

async function unmuteCommand(sock, chatId, senderId, message) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour lever le silence, Monsieur.' }, { quoted: message });
        return;
    }
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent lever le silence, Monsieur.' }, { quoted: message });
        return;
    }
    try {
        await sock.groupSettingUpdate(chatId, 'not_announcement');
        await sock.sendMessage(chatId, { text: '🎩 Le silence est levé, Monsieur. La Maison VALENHART peut de nouveau s\'exprimer librement. ✨' }, { quoted: message });
    } catch (error) {
        console.error('Error unmuting:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'empêche de lever le silence pour le moment. Mes excuses, Monsieur.' }, { quoted: message });
    }
}

module.exports = unmuteCommand;
