async function resetlinkCommand(sock, chatId, senderId, message) {
    try {
        const groupMetadata = await sock.groupMetadata(chatId);
        const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';

        if (!admins.includes(senderId)) {
            await sock.sendMessage(chatId, { text: '🎩 Cette opération est réservée aux administrateurs de la demeure, Monsieur.' }, { quoted: message });
            return;
        }
        if (!admins.includes(botId)) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour réinitialiser le lien, Monsieur.' }, { quoted: message });
            return;
        }

        const newCode = await sock.groupRevokeInvite(chatId);
        await sock.sendMessage(chatId, {
            text: `🎩 *Lien de la Maison réinitialisé avec succès, Monsieur.*\n\n🔗 *Nouveau lien d'invitation :*\nhttps://chat.whatsapp.com/${newCode}\n\n> _"Alfred veille à la sécurité des portes de la Maison VALENHART."_ 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in resetlink command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La réinitialisation du lien a rencontré un contretemps, Monsieur. Vérifiez mes privilèges d\'administrateur.' }, { quoted: message });
    }
}

module.exports = resetlinkCommand;
