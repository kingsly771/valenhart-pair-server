const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');

const CONFIG_PATH = path.join(__dirname, '../data/autotyping.json');

function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch { return { enabled: false }; }
}
function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch {}
}

async function autotypingCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison, Monsieur.' }, { quoted: message });
            return;
        }

        const config = loadConfig();
        const sub = (args || '').trim().toLowerCase();

        if (sub === 'on') {
            config.enabled = true;
            saveConfig(config);
            await sock.sendMessage(chatId, { text: '🎩 *Indicateur de frappe activé, Monsieur.* ✅\n\n> _Alfred signalera sa présence avant chaque réponse._ 🎩' }, { quoted: message });
        } else if (sub === 'off') {
            config.enabled = false;
            saveConfig(config);
            await sock.sendMessage(chatId, { text: '🎩 *Indicateur de frappe désactivé, Monsieur.* ❌\n\n> _Alfred répondra discrètement._ 🎩' }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Indicateur de Frappe*\n\n*.autotyping on* — Activer\n*.autotyping off* — Désactiver\n\n` +
                      `État actuel : ${config.enabled ? '✅ *Activé*' : '❌ *Désactivé*'}\n\n` +
                      `> _"Alfred annonce toujours son arrivée avec élégance."_ 🎩`
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in autotyping command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Un contretemps m\'a empêché de modifier ce paramètre, Monsieur.' }, { quoted: message });
    }
}

async function handleAutoTyping(sock, chatId) {
    const config = loadConfig();
    if (!config.enabled) return;
    try {
        await sock.presenceSubscribe(chatId);
        await sock.sendPresenceUpdate('composing', chatId);
    } catch {}
}

module.exports = { autotypingCommand, handleAutoTyping, loadConfig };

function isAutotypingEnabled() { return loadConfig().enabled; }
async function handleAutotypingForMessage(sock, chatId, userMessage) {
    if (!loadConfig().enabled) return;
    try { await sock.sendPresenceUpdate('composing', chatId); } catch {}
}
async function handleAutotypingForCommand(sock, chatId) {
    if (!loadConfig().enabled) return;
    try { await sock.sendPresenceUpdate('composing', chatId); } catch {}
}
async function showTypingAfterCommand(sock, chatId) {
    if (!loadConfig().enabled) return;
    try { await sock.sendPresenceUpdate('paused', chatId); } catch {}
}

module.exports = { autotypingCommand, handleAutoTyping, isAutotypingEnabled, handleAutotypingForMessage, handleAutotypingForCommand, showTypingAfterCommand, loadConfig };
