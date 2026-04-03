const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const CONFIG_PATH = path.join(__dirname, '../data/autoread.json');

function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch { return { enabled: false }; }
}
function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch {}
}

async function autoreadCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.' }, { quoted: message });
            return;
        }

        const config = loadConfig();
        const sub = (args || '').trim().toLowerCase();

        if (sub === 'on') {
            config.enabled = true;
            saveConfig(config);
            await sock.sendMessage(chatId, { text: '🎩 *Lecture automatique activée, Monsieur.* ✅\n\n> _Alfred marque tous les messages comme lus instantanément._ 🎩' }, { quoted: message });
        } else if (sub === 'off') {
            config.enabled = false;
            saveConfig(config);
            await sock.sendMessage(chatId, { text: '🎩 *Lecture automatique désactivée, Monsieur.* ❌\n\n> _Alfred respecte votre rythme de lecture._ 🎩' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Lecture Automatique*\n\n` +
                      `*.autoread on* — Activer\n*.autoread off* — Désactiver\n\n` +
                      `État actuel : ${config.enabled ? '✅ *Activée*' : '❌ *Désactivée*'}\n\n` +
                      `> _"Alfred lit chaque message avec l'attention qu'il mérite."_ 🎩`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in autoread command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché de modifier ce paramètre, Monsieur.' }, { quoted: message });
    }
}

async function handleAutoRead(sock, message) {
    const config = loadConfig();
    if (!config.enabled) return;
    try {
        await sock.readMessages([message.key]);
    } catch {}
}

module.exports = { autoreadCommand, handleAutoRead, loadConfig };

function isAutoreadEnabled() { return loadConfig().enabled; }
async function handleAutoread(sock, message) { return handleAutoRead(sock, message); }

module.exports = { autoreadCommand, handleAutoRead, handleAutoread, isAutoreadEnabled, loadConfig };
