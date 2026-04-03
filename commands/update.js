const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const settings = require('../settings');
const isOwnerOrSudo = require('../lib/isOwner');

function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { windowsHide: true }, (err, stdout, stderr) => {
            if (err) return reject(new Error((stderr || stdout || err.message || '').toString()));
            resolve((stdout || '').toString());
        });
    });
}

async function updateCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette opération est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred vérifie les mises à jour de la Maison VALENHART, Monsieur...*\n_Un instant de patience, je vous prie._ 🕵️`
        }, { quoted: message });

        const hasGit = fs.existsSync(path.join(process.cwd(), '.git'));
        if (hasGit) {
            try {
                await run('git fetch');
                const status = await run('git status');
                if (status.includes('behind')) {
                    await run('git pull');
                    await sock.sendMessage(chatId, {
                        text: `🎩 *Mise à jour réussie, Monsieur !*\n\n✅ La Maison VALENHART est désormais à jour.\n\n> _"Alfred veille à ce que la demeure soit toujours à la pointe."_ ✨`
                    }, { quoted: message });
                } else {
                    await sock.sendMessage(chatId, {
                        text: `🎩 *Aucune mise à jour nécessaire, Monsieur.*\n\n✅ La Maison VALENHART est déjà à jour (v${settings.version}).\n\n> _"La perfection ne nécessite aucune amélioration."_ — Alfred 🎩`
                    }, { quoted: message });
                }
            } catch (e) {
                await sock.sendMessage(chatId, { text: `🎩 La mise à jour a rencontré un contretemps, Monsieur.\n_Erreur : ${e.message}_` }, { quoted: message });
            }
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred consulte les archives de mise à jour, Monsieur...*\n\nVersion actuelle : *v${settings.version}*\n\nPour mettre à jour manuellement :\n\`\`\`git pull origin main\`\`\`\n\n> _Alfred recommande de sauvegarder vos données avant toute mise à jour._ 🎩`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in update command:', error);
        await sock.sendMessage(chatId, { text: '🎩 La vérification des mises à jour a rencontré un contretemps, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = updateCommand;
