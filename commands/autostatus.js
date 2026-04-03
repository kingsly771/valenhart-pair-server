const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const CONFIG_PATH = path.join(__dirname, '../data/autostatus.json');

function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch { return { enabled: false, view: false, react: false }; }
}
function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch {}
}

async function autostatusCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        const config = loadConfig();
        const sub = (args || '').trim().toLowerCase();

        if (sub === 'view on') { config.view = true; saveConfig(config); await sock.sendMessage(chatId, { text: '🎩 Alfred visionne désormais les statuts automatiquement. ✅' }, { quoted: message }); }
        else if (sub === 'view off') { config.view = false; saveConfig(config); await sock.sendMessage(chatId, { text: '🎩 Visionnage automatique des statuts désactivé. ❌' }, { quoted: message }); }
        else if (sub === 'react on') { config.react = true; saveConfig(config); await sock.sendMessage(chatId, { text: '🎩 Alfred réagit désormais aux statuts automatiquement. ✅' }, { quoted: message }); }
        else if (sub === 'react off') { config.react = false; saveConfig(config); await sock.sendMessage(chatId, { text: '🎩 Réaction automatique aux statuts désactivée. ❌' }, { quoted: message }); }
        else {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Gestion des Statuts*\n\n` +
                      `*.autostatus view on/off* — Visionner les statuts\n` +
                      `*.autostatus react on/off* — Réagir aux statuts\n\n` +
                      `👁️ Visionnage : ${config.view ? '✅' : '❌'}\n` +
                      `❤️ Réactions : ${config.react ? '✅' : '❌'}\n\n` +
                      `> _"Alfred prend connaissance de chaque publication."_ 🎩`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in autostatus command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché de modifier ce paramètre, Monsieur.' }, { quoted: message });
    }
}

module.exports = { autostatusCommand, loadConfig };

// Alias exports for compatibility
async function autoStatusCommand(sock, chatId, message, args) {
    return autostatusCommand(sock, chatId, message, args ? args.join(' ') : '');
}

async function handleStatusUpdate(sock, status) {
    const config = loadConfig();
    if (!config.view && !config.react) return;
    try {
        if (status?.messages) {
            for (const msg of status.messages) {
                if (msg.key?.remoteJid === 'status@broadcast') {
                    if (config.view) {
                        await sock.readMessages([msg.key]).catch(() => {});
                    }
                    if (config.react) {
                        await sock.sendMessage(msg.key.remoteJid, {
                            react: { text: '🎩', key: msg.key }
                        }).catch(() => {});
                    }
                }
            }
        }
    } catch (e) { console.error('handleStatusUpdate error:', e); }
}

module.exports = { autostatusCommand, autoStatusCommand, handleStatusUpdate, loadConfig };
