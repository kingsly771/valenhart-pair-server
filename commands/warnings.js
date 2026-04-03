const fs = require('fs');
const path = require('path');

const warningsFilePath = path.join(__dirname, '../data/warnings.json');

function loadWarnings() {
    if (!fs.existsSync(warningsFilePath)) {
        fs.writeFileSync(warningsFilePath, JSON.stringify({}), 'utf8');
    }
    return JSON.parse(fs.readFileSync(warningsFilePath, 'utf8'));
}

async function warningsCommand(sock, chatId, mentionedJidList, message) {
    if (!mentionedJidList || mentionedJidList.length === 0) {
        await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez désigner le membre dont vous souhaitez consulter le dossier d\'avertissements.' }, { quoted: message });
        return;
    }
    const warnings = loadWarnings();
    const userToCheck = mentionedJidList[0];
    const count = (warnings[chatId] && warnings[chatId][userToCheck]) || 0;

    await sock.sendMessage(chatId, {
        text: `🎩 *Dossier d\'avertissements — Maison VALENHART*\n\n` +
              `👤 @${userToCheck.split('@')[0]}\n` +
              `⚠️ *Avertissements enregistrés :* ${count}/3\n\n` +
              `> _Alfred maintient les registres avec la plus grande rigueur._ 📜`,
        mentions: [userToCheck]
    }, { quoted: message });
}

module.exports = warningsCommand;
