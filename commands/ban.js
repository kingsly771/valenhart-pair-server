const fs = require('fs');
const { channelInfo } = require('../lib/messageConfig');
const isAdmin = require('../lib/isAdmin');
const { isSudo } = require('../lib/index');

async function banCommand(sock, chatId, message) {
    const isGroup = chatId.endsWith('@g.us');
    if (isGroup) {
        const senderId = message.key.participant || message.key.remoteJid;
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Monsieur, il me faudrait les prérogatives d\'administrateur pour exécuter cette mesure. Veuillez me les accorder.', ...channelInfo }, { quoted: message });
            return;
        }
        if (!isSenderAdmin && !message.key.fromMe) {
            await sock.sendMessage(chatId, { text: '🎩 Cette opération est réservée aux administrateurs de la demeure. Votre rang ne vous y autorise pas, Monsieur.', ...channelInfo }, { quoted: message });
            return;
        }
    } else {
        const senderId = message.key.participant || message.key.remoteJid;
        const senderIsSudo = await isSudo(senderId);
        if (!message.key.fromMe && !senderIsSudo) {
            await sock.sendMessage(chatId, { text: '🎩 Seuls le Maître ou ses lieutenants de confiance peuvent user de cette commande en privé, Monsieur.', ...channelInfo }, { quoted: message });
            return;
        }
    }

    let userToBan;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToBan = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToBan = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToBan) {
        await sock.sendMessage(chatId, { text: '🎩 Puis-je vous demander, Monsieur, d\'identifier la personne visée par cette mesure ?', ...channelInfo }, { quoted: message });
        return;
    }

    try {
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
        if (userToBan === botId) {
            await sock.sendMessage(chatId, { text: '🎩 Je me permets de faire observer, Monsieur, qu\'un majordome ne peut s\'interdire lui-même.', ...channelInfo }, { quoted: message });
            return;
        }
    } catch {}

    try {
        const bannedUsers = JSON.parse(fs.readFileSync('./data/banned.json'));
        if (!bannedUsers.includes(userToBan)) {
            bannedUsers.push(userToBan);
            fs.writeFileSync('./data/banned.json', JSON.stringify(bannedUsers, null, 2));
            await sock.sendMessage(chatId, {
                text: `🎩 Très bien, Monsieur. @${userToBan.split('@')[0]} a été banni de la Maison VALENHART.\n_Alfred a consigné cette décision dans les registres._`,
                mentions: [userToBan], ...channelInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 Permettez-moi de vous signaler, Monsieur, que @${userToBan.split('@')[0]} figure déjà sur la liste des personnes indésirables.`,
                mentions: [userToBan], ...channelInfo
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in ban command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Une contrariété regrettable m\'a empêché d\'exécuter cette mesure. Mes excuses, Monsieur.', ...channelInfo }, { quoted: message });
    }
}

module.exports = banCommand;
