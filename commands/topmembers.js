const fs = require('fs');
const path = require('path');

const dataFilePath = path.join(__dirname, '..', 'data', 'messageCount.json');

function loadMessageCounts() {
    if (fs.existsSync(dataFilePath)) {
        try { return JSON.parse(fs.readFileSync(dataFilePath)); } catch {}
    }
    return {};
}

function saveMessageCounts(data) {
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
}

function incrementMessageCount(groupId, userId) {
    const data = loadMessageCounts();
    if (!data[groupId] || typeof data[groupId] !== 'object') data[groupId] = {};
    if (!data[groupId][userId]) data[groupId][userId] = 0;
    data[groupId][userId]++;
    saveMessageCounts(data);
}

function normalizeJid(jid) {
    if (typeof jid !== 'string') return jid;
    if (jid.includes(':') && jid.includes('@s.whatsapp.net')) {
        return jid.split(':')[0] + '@s.whatsapp.net';
    }
    return jid;
}

// Extract valid JID entries from a group — with fallback across all groups
function getGroupCounts(data, chatId) {
    function extractValid(obj) {
        const counts = {};
        for (const [k, v] of Object.entries(obj)) {
            if (k.includes('@s.whatsapp.net') && typeof v === 'number') {
                counts[normalizeJid(k)] = (counts[normalizeJid(k)] || 0) + v;
            }
        }
        return counts;
    }

    // Try exact chatId match first
    const entry = data[chatId];
    if (entry && typeof entry === 'object') {
        const counts = extractValid(entry);
        if (Object.keys(counts).length > 0) return counts;
    }

    // Fallback: merge ALL groups in file
    const merged = {};
    for (const [key, val] of Object.entries(data)) {
        if (key === 'isPublic' || typeof val !== 'object' || val === null) continue;
        for (const [k, v] of Object.entries(val)) {
            if (k.includes('@s.whatsapp.net') && typeof v === 'number') {
                merged[normalizeJid(k)] = (merged[normalizeJid(k)] || 0) + v;
            }
        }
    }
    return merged;
}

function topMembers(sock, chatId, isGroup) {
    if (!isGroup) {
        sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée aux groupes, Monsieur.' });
        return;
    }
    const data = loadMessageCounts();
    const groupCounts = getGroupCounts(data, chatId);

    if (!Object.keys(groupCounts).length) {
        sock.sendMessage(chatId, { text: '🎩 Les registres d\'activité sont encore vides, Monsieur.' });
        return;
    }

    const sorted = Object.entries(groupCounts).sort(([, a], [, b]) => b - a).slice(0, 10);
    const medals = ['🥇', '🥈', '🥉', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];
    const mentions = sorted.map(([jid]) => jid);

    let rows = sorted.map(([jid, count], i) =>
        `│ ${medals[i]} @${jid.split('@')[0]} — *${count} msg*`
    ).join('\n');

    sock.sendMessage(chatId, {
        text:
`┏━━━━━━━━━━━━━━━━━━━━━━━┓\n┃  🏆  *PALMARÈS DE LA MAISON*\n┗━━━━━━━━━━━━━━━━━━━━━━━┛\n\n╭────〔 ✦ CLASSEMENT 〕────\n${rows}\n╰──────────────────────────\n\n> _"L'excellence se mesure à l'engagement."_ — *Alfred* 🎩`,
        mentions
    });
}

module.exports = { topMembers, incrementMessageCount, getGroupCounts };
