async function staffCommand(sock, chatId, msg) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        let pp;
        try { pp = await sock.profilePictureUrl(chatId, 'image'); } catch { pp = 'https://i.imgur.com/2wzGhpF.jpeg'; }

        const participants = groupMetadata.participants;
        const groupAdmins = participants.filter(p => p.admin);
        const owner = groupMetadata.owner || groupAdmins.find(p => p.admin === 'superadmin')?.id;
        const listAdmin = groupAdmins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n▢ ');

        const text = `🎩 *Corps administratif — ${groupMetadata.subject}*\n` +
                     `${'─'.repeat(30)}\n\n` +
                     `🛡️ *Administrateurs de la demeure :*\n▢ ${listAdmin}\n\n` +
                     `> _"Ces serviteurs de la Maison méritent respect et considération."_\n> — Alfred 🎩`;

        await sock.sendMessage(chatId, {
            image: { url: pp },
            caption: text,
            mentions: [...groupAdmins.map(v => v.id), owner].filter(Boolean)
        }, { quoted: msg });
    } catch (error) {
        console.error('Error in staff command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le registre des administrateurs m\'est temporairement inaccessible. Mes excuses, Monsieur.' }, { quoted: msg });
    }
}

module.exports = staffCommand;
