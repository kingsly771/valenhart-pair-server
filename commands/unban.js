const fs = require('fs');
const path = require('path');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

async function unbanCommand(sock, chatId, message) {
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour lever cette interdiction, Monsieur.', ...channelInfo }, { quoted: message });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '🎩 Cette décision appartient aux administrateurs de la demeure, Monsieur.', ...channelInfo }, { quoted: message });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        if (!message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { text: '🎩 Seuls le Maître ou ses lieutenants peuvent user de cette commande en privé, Monsieur.', ...channelInfo }, { quoted: message });
            return;
        }
    }

    let userToUnban;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToUnban = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToUnban = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToUnban) {
        await sock.sendMessage(chatId, { text: '🎩 Veuillez, Monsieur, désigner la personne dont vous souhaitez lever l\'interdiction.', ...channelInfo }, { quoted: message });
        return;
    }

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        const index = bannedUsers.indexOf(userToUnban);
        if (index > -1) {
            bannedUsers.splice(index, 1);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            await sock.sendMessage(chatId, {
                text: `🎩 Comme vous le souhaitez, Monsieur. @${userToUnban.split('@')[0]} est réhabilité auprès de la Maison VALENHART.\n_Alfred a mis le registre à jour._ ✨`,
                mentions: [userToUnban], ...channelInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 Je me permets de vous informer, Monsieur, que @${userToUnban.split('@')[0]} ne figure pas sur la liste des personnes bannies.`,
                mentions: [userToUnban], ...channelInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in unban command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Je suis dans l\'impossibilité de lever cette interdiction pour le moment. Mes excuses, Monsieur.', ...channelInfo }, { quoted: message });
    }
}

module.exports = unbanCommand;
