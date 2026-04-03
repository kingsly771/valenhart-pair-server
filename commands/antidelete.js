const fs = require('fs');
const path = require('path');
const { tmpdir } = require('os');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
const { writeFile } = require('fs/promises');

const messageStore = new Map();
const CONFIG_PATH = path.join(__dirname, '../data/antidelete.json');
const TEMP_MEDIA_DIR = path.join(__dirname, '../tmp');

if (!fs.existsSync(TEMP_MEDIA_DIR)) fs.mkdirSync(TEMP_MEDIA_DIR, { recursive: true });

const getFolderSizeInMB = (folderPath) => {
    try {
        const files = fs.readdirSync(folderPath);
        let total = 0;
        for (const f of files) {
            const fp = path.join(folderPath, f);
            if (fs.statSync(fp).isFile()) total += fs.statSync(fp).size;
        }
        return total / (1024 * 1024);
    } catch { return 0; }
};

function loadConfig() {
    try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8')); }
    catch { return { enabled: false }; }
}
function saveConfig(config) {
    try { fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2)); } catch {}
}

async function antideleteCommand(sock, chatId, message, args, isOwner) {
    const config = loadConfig();
    const sub = (args || '').trim().toLowerCase();

    if (!isOwner) {
        await sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison, Monsieur.' }, { quoted: message });
        return;
    }

    if (sub === 'on') {
        config.enabled = true;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: '🎩 *Protection Anti-Suppression activée, Monsieur.* ✅\n\n> _Alfred récupère les messages supprimés avec discrétion._ 🕵️' }, { quoted: message });
    } else if (sub === 'off') {
        config.enabled = false;
        saveConfig(config);
        await sock.sendMessage(chatId, { text: '🎩 *Protection Anti-Suppression désactivée, Monsieur.* ❌' }, { quoted: message });
    } else {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Protection Anti-Suppression*\n\n*.antidelete on* — Activer\n*.antidelete off* — Désactiver\n\nÉtat actuel : ${config.enabled ? '✅ *Activée*' : '❌ *Désactivée*'}\n\n> _"Alfred récupère ce que d'autres voudraient effacer."_ 🎩`
        }, { quoted: message });
    }
}

function storeMessage(key, message) {
    const config = loadConfig();
    if (!config.enabled) return;
    if (getFolderSizeInMB(TEMP_MEDIA_DIR) > 200) return;
    messageStore.set(key, { message, timestamp: Date.now() });
    if (messageStore.size > 500) {
        const oldest = [...messageStore.entries()].sort(([, a], [, b]) => a.timestamp - b.timestamp)[0];
        if (oldest) messageStore.delete(oldest[0]);
    }
}

async function handleDeletedMessage(sock, key) {
    const config = loadConfig();
    if (!config.enabled) return;

    const stored = messageStore.get(key);
    if (!stored) return;

    const { message, timestamp } = stored;
    if (Date.now() - timestamp > 60 * 60 * 1000) return;

    try {
        const m = message.message;
        const sender = key.split('|')[0] || 'Inconnu';
        const senderNum = sender.split('@')[0];
        const prefix = `🎩 *Alfred a récupéré un message supprimé, Monsieur :*\n👤 *Auteur :* @${senderNum}\n${'─'.repeat(28)}\n`;

        if (m?.conversation) {
            await sock.sendMessage(key.includes('@g.us') ? key.split('|')[1] : sender, {
                text: `${prefix}💬 _"${m.conversation}"_`,
                mentions: [sender]
            });
        } else if (m?.extendedTextMessage?.text) {
            await sock.sendMessage(key.includes('@g.us') ? key.split('|')[1] : sender, {
                text: `${prefix}💬 _"${m.extendedTextMessage.text}"_`,
                mentions: [sender]
            });
        } else if (m?.imageMessage) {
            await sock.sendMessage(key.includes('@g.us') ? key.split('|')[1] : sender, {
                text: `${prefix}🖼️ _Image supprimée${m.imageMessage.caption ? ` : "${m.imageMessage.caption}"` : ''}_`,
                mentions: [sender]
            });
        }
        messageStore.delete(key);
    } catch (e) { console.error('Antidelete error:', e); }
}

module.exports = { antideleteCommand, storeMessage, handleDeletedMessage, loadConfig };

// Aliases for main.js compatibility
async function handleAntideleteCommand(sock, chatId, message, args) {
    const isOwner = message.key.fromMe || require('../lib/isOwner')(message.key.participant || message.key.remoteJid, sock, chatId);
    return antideleteCommand(sock, chatId, message, args, await isOwner);
}
async function handleMessageRevocation(sock, message) {
    const key = message.key?.id;
    if (key) await handleDeletedMessage(sock, key);
}
function storeMessageCompat(sock, message) {
    const key = message.key?.id + '|' + message.key?.remoteJid;
    storeMessage(key, message);
}

module.exports = { antideleteCommand, handleAntideleteCommand, handleMessageRevocation, storeMessage: storeMessageCompat, handleDeletedMessage, loadConfig };
