const isAdmin = require('../lib/isAdmin');

async function muteCommand(sock, chatId, senderId, message, durationInMinutes) {
    const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
    if (!isBotAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour imposer le silence dans cette demeure, Monsieur.' }, { quoted: message });
        return;
    }
    if (!isSenderAdmin) {
        await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent ordonner le silence, Monsieur. Votre rang ne vous y autorise pas.' }, { quoted: message });
        return;
    }

    try {
        await sock.groupSettingUpdate(chatId, 'announcement');
        if (durationInMinutes !== undefined && durationInMinutes > 0) {
            await sock.sendMessage(chatId, {
                text: `🎩 Très bien, Monsieur. La demeure est placée sous silence pour *${durationInMinutes} minute${durationInMinutes > 1 ? 's' : ''}*.\n_Alfred veillera à lever la mesure en temps voulu._ 🕯️`
            }, { quoted: message });
            setTimeout(async () => {
                try {
                    await sock.groupSettingUpdate(chatId, 'not_announcement');
                    await sock.sendMessage(chatId, { text: '🎩 La période de silence est levée, Monsieur. La Maison VALENHART peut de nouveau s\'exprimer. ✨' });
                } catch (e) { console.error('Error unmuting:', e); }
            }, durationInMinutes * 60 * 1000);
        } else {
            await sock.sendMessage(chatId, { text: '🎩 La demeure est désormais sous silence, Monsieur.\n_Alfred maintient l\'ordre et la sérénité._ 🕯️' }, { quoted: message });
        }
    } catch (error) {
        console.error('Error muting group:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps technique m\'a empêché d\'agir sur le silence du groupe. Mes excuses, Monsieur.' }, { quoted: message });
    }
}

module.exports = muteCommand;
