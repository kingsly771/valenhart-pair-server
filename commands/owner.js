const settings = require('../settings');

async function ownerCommand(sock, chatId, message) {
    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${settings.botOwner}\nTEL;waid=${settings.ownerNumber}:${settings.ownerNumber}\nEND:VCARD`;

    await sock.sendMessage(chatId, {
        text: `🎩 *Alfred vous présente le Maître de la Maison VALENHART, Monsieur.*\n\n> _"Le Maître est la raison d'être de chaque majordome qui se respecte."_ 🕯️`
    }, { quoted: message });

    await sock.sendMessage(chatId, {
        contacts: { displayName: settings.botOwner, contacts: [{ vcard }] }
    });
}

module.exports = ownerCommand;
