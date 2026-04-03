const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

function clearDirectory(dirPath) {
    try {
        if (!fs.existsSync(dirPath)) return { success: false, message: `Répertoire introuvable : ${path.basename(dirPath)}`, count: 0 };
        const files = fs.readdirSync(dirPath);
        let count = 0;
        for (const file of files) {
            try {
                const fp = path.join(dirPath, file);
                fs.lstatSync(fp).isDirectory() ? fs.rmSync(fp, { recursive: true, force: true }) : fs.unlinkSync(fp);
                count++;
            } catch (e) { console.error(`Error deleting ${file}:`, e); }
        }
        return { success: true, message: `${count} fichier(s) supprimé(s) dans *${path.basename(dirPath)}*`, count };
    } catch (error) {
        return { success: false, message: `Échec du nettoyage de *${path.basename(dirPath)}*`, count: 0 };
    }
}

async function cleartmpCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette opération est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, { text: '🎩 *Alfred nettoie les archives temporaires de la Maison, Monsieur...*\n_Un instant de patience, je vous prie._' }, { quoted: message });

        const tmpDir = path.join(process.cwd(), 'tmp');
        const tempDir = path.join(process.cwd(), 'temp');
        const results = [];

        if (fs.existsSync(tmpDir)) results.push(clearDirectory(tmpDir));
        if (fs.existsSync(tempDir)) results.push(clearDirectory(tempDir));

        const totalDeleted = results.reduce((s, r) => s + r.count, 0);
        const details = results.map(r => `${r.success ? '✅' : '❌'} ${r.message}`).join('\n');

        await sock.sendMessage(chatId, {
            text: `🎩 *Nettoyage effectué, Monsieur !*\n\n${details}\n\n📊 *Total :* ${totalDeleted} fichier(s) supprimé(s)\n\n> _"La Maison VALENHART brille de propreté."_ — Alfred 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in cleartmp command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Le nettoyage a rencontré un contretemps, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = cleartmpCommand;
