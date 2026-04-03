const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {};

async function clearSessionCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);

        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette opération est réservée au Maître de la Maison VALENHART, Monsieur.', ...channelInfo });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred prépare la purge de la session, Monsieur...*\n_Un instant, je vous prie._', ...channelInfo }, { quoted: msg });

        const sessionDir = path.join(process.cwd(), 'session');
        if (!fs.existsSync(sessionDir)) {
            await sock.sendMessage(chatId, { text: '🎩 Aucun répertoire de session à purger, Monsieur.', ...channelInfo }, { quoted: msg });
            return;
        }

        const files = fs.readdirSync(sessionDir).filter(f => !f.includes('creds'));
        let count = 0;
        for (const f of files) {
            try { fs.unlinkSync(path.join(sessionDir, f)); count++; } catch {}
        }

        await sock.sendMessage(chatId, {
            text: `🎩 *Session purgée, Monsieur !*\n\n🗑️ *${count} fichier(s) supprimé(s)*\n\n> _"Alfred maintient la Maison dans le meilleur état."_ ✨`,
            ...channelInfo
        }, { quoted: msg });
    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La purge de session a rencontré un contretemps, Monsieur. Mes excuses.', ...channelInfo }, { quoted: msg });
    }
}

module.exports = clearSessionCommand;
