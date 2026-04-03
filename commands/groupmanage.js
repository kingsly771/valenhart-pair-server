const isAdmin = require('../lib/isAdmin');

async function groupManageCommand(sock, chatId, senderId, action, value, message) {
    try {
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);

        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour gérer la demeure, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Cette fonction est réservée aux administrateurs de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        switch (action) {
            case 'setgname':
                if (!value) { await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez préciser le nouveau nom de la demeure.' }, { quoted: message }); return; }
                await sock.groupUpdateSubject(chatId, value);
                await sock.sendMessage(chatId, { text: `🎩 *Alfred a renommé la demeure en :* *"${value}"*\n> _Le prestige de la Maison VALENHART se perpétue._ ✨` }, { quoted: message });
                break;

            case 'setgdesc':
                if (!value) { await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez préciser la nouvelle description.' }, { quoted: message }); return; }
                await sock.groupUpdateDescription(chatId, value);
                await sock.sendMessage(chatId, { text: `🎩 *Alfred a mis à jour la description de la demeure, Monsieur.*\n\n📜 _"${value}"_\n\n> _Consigné dans les registres de la Maison VALENHART._ 🎩` }, { quoted: message });
                break;

            case 'setgpp':
                await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez utiliser *.setgpp* en répondant à une image pour modifier la photo du groupe.' }, { quoted: message });
                break;

            default:
                await sock.sendMessage(chatId, {
                    text: `🎩 *Alfred — Gestion de la Demeure*\n\n` +
                          `*.setgname <nom>* — Renommer le groupe\n` +
                          `*.setgdesc <description>* — Modifier la description\n` +
                          `*.setgpp* (répondre à une image) — Changer la photo\n\n` +
                          `> _"Alfred administre la Maison VALENHART avec rigueur."_ 🎩`
                }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in groupmanage command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La gestion du groupe a rencontré un contretemps, Monsieur. Vérifiez mes privilèges d\'administrateur.' }, { quoted: message });
    }
}

module.exports = groupManageCommand;
