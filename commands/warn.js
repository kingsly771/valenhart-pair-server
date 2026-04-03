const fs = require('fs');
const path = require('path');
const isAdmin = require('../lib/isAdmin');

const databaseDir = path.join(process.cwd(), 'data');
const warningsPath = path.join(databaseDir, 'warnings.json');

function initWarnings() {
    if (!fs.existsSync(databaseDir)) fs.mkdirSync(databaseDir, { recursive: true });
    if (!fs.existsSync(warningsPath)) fs.writeFileSync(warningsPath, JSON.stringify({}));
}

async function warnCommand(sock, chatId, senderId, mentionedJids, message) {
    try {
        initWarnings();
        if (!chatId.endsWith('@g.us')) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande ne peut être utilisée qu\'au sein d\'un groupe, Monsieur.' }, { quoted: message });
            return;
        }
        const { isSenderAdmin, isBotAdmin } = await isAdmin(sock, chatId, senderId);
        if (!isBotAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Il me faudrait les prérogatives d\'administrateur pour émettre un avertissement officiel, Monsieur.' }, { quoted: message });
            return;
        }
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, { text: '🎩 Seuls les administrateurs peuvent émettre des avertissements, Monsieur.' }, { quoted: message });
            return;
        }

        let userToWarn;
        if (mentionedJids && mentionedJids.length > 0) userToWarn = mentionedJids[0];
        else if (message.message?.extendedTextMessage?.contextInfo?.participant) userToWarn = message.message.extendedTextMessage.contextInfo.participant;

        if (!userToWarn) {
            await sock.sendMessage(chatId, { text: '🎩 Puis-je vous demander, Monsieur, à qui adresser cet avertissement ?' }, { quoted: message });
            return;
        }

        await new Promise(r => setTimeout(r, 1000));
        let warnings = {};
        try { warnings = JSON.parse(fs.readFileSync(warningsPath, 'utf8')); } catch { warnings = {}; }
        if (!warnings[chatId]) warnings[chatId] = {};
        if (!warnings[chatId][userToWarn]) warnings[chatId][userToWarn] = 0;
        warnings[chatId][userToWarn]++;
        fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));

        const count = warnings[chatId][userToWarn];
        await sock.sendMessage(chatId, {
            text: `┏━━━━━━━━━━━━━━━━━━━━━━━┓
┃  ⚠️  *AVERTISSEMENT OFFICIEL*
┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
                  `⚠️ @${userToWarn.split('@')[0]} reçoit un avertissement solennel.\n` +
                  `📊 *Avertissements :* ${count}/3\n` +
                  `🫡 *Émis par :* @${senderId.split('@')[0]}\n` +
                  `📅 *Date :* ${new Date().toLocaleString('fr-FR')}\n\n` +
                  `> _"La Maison VALENHART pardonne une fois, tolère deux fois. La troisième... Alfred tient la porte ouverte."_ 🎩`,
            mentions: [userToWarn, senderId]
        }, { quoted: message });

        if (count >= 3) {
            await new Promise(r => setTimeout(r, 1000));
            await sock.groupParticipantsUpdate(chatId, [userToWarn], 'remove');
            delete warnings[chatId][userToWarn];
            fs.writeFileSync(warningsPath, JSON.stringify(warnings, null, 2));
            await sock.sendMessage(chatId, {
                text: `🎩 *Expulsion — Maison VALENHART*\n\n@${userToWarn.split('@')[0]} a reçu trois avertissements et a été reconduit à la porte par Alfred.\n_La Maison VALENHART maintient ses standards._ ✨`,
                mentions: [userToWarn]
            });
        }
    } catch (error) {
        console.error('Error in warn command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché d\'émettre cet avertissement. Mes excuses, Monsieur.' }, { quoted: message });
    }
}

module.exports = warnCommand;
