const { setAntitag, getAntitag, removeAntitag, getSudoList } = require('../lib/index');
const settings = require('../settings');

// ─── Build list of protected JIDs (owner + bot + all sudo numbers) ────────────
async function getProtectedJids(sock) {
    const protected_ = [];

    // Owner JID
    const ownerRaw = settings.ownerNumber || '';
    const ownerJid = ownerRaw.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    if (ownerJid) protected_.push(ownerJid);

    // Bot's own JID
    const botJid = sock.user?.id
        ? sock.user.id.split(':')[0] + '@s.whatsapp.net'
        : null;
    if (botJid) protected_.push(botJid);

    // All sudo users
    try {
        const sudoList = await getSudoList();
        for (const sudoId of sudoList) {
            const sudoJid = sudoId.includes('@') ? sudoId : sudoId + '@s.whatsapp.net';
            if (!protected_.includes(sudoJid)) protected_.push(sudoJid);
        }
    } catch {}

    return protected_.filter(Boolean);
}

// ─── Check if a message tags any of the protected JIDs ───────────────────────
function messageTagsTarget(message, targetJids) {
    if (!targetJids || targetJids.length === 0) return false;

    // Check mentionedJid in extendedTextMessage
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    for (const jid of targetJids) {
        if (mentioned.includes(jid)) return true;
    }

    // Check text for @number pattern
    const text = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || '';
    for (const jid of targetJids) {
        const num = jid.split('@')[0];
        if (text.includes(`@${num}`)) return true;
    }

    return false;
}

// ─── Detect WhatsApp @all / @tous broadcast tag ──────────────────────────────
async function isAtAllTag(sock, chatId, message) {
    const text = message.message?.conversation
        || message.message?.extendedTextMessage?.text
        || message.message?.imageMessage?.caption
        || message.message?.videoMessage?.caption
        || '';

    // Explicit @all or @tous in message text
    if (/\@(all|tous)\b/i.test(text)) return true;

    // WhatsApp encodes @all by mentioning every participant —
    // detect when mentionedJid count matches (or nearly matches) group size
    const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentioned.length >= 5) {
        try {
            const meta = await sock.groupMetadata(chatId);
            const total = meta.participants.length;
            // If >= 80% of participants are tagged, treat it as @all
            if (mentioned.length >= Math.max(5, Math.floor(total * 0.8))) return true;
        } catch {}
    }

    return false;
}

// ─── Runtime tag detection — fires on every group message ────────────────────
async function handleTagDetection(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;

        // Check if antitag is enabled for this group
        const config = await getAntitag(chatId, 'on');
        if (!config || !config.enabled) return;

        // Get all protected JIDs (owner + bot + all sudo)
        const protectedJids = await getProtectedJids(sock);

        // Allow the protected people themselves to send any message
        if (protectedJids.some(jid => senderId === jid || senderId.startsWith(jid.split('@')[0]))) return;

        // ── Check 1: tagging protected JIDs (owner/sudo) ──
        const tagsProtected = messageTagsTarget(message, protectedJids);

        // ── Check 2: using @all / @tous WhatsApp broadcast tag ──
        const usedAtAll = await isAtAllTag(sock, chatId, message);

        if (!tagsProtected && !usedAtAll) return;

        // ── Delete message immediately ──
        try {
            await sock.sendMessage(chatId, { delete: message.key });
        } catch {}

        // ── Kick sender immediately — NO exception for admins ──
        try {
            await sock.groupParticipantsUpdate(chatId, [senderId], 'remove');
        } catch {}

        // ── Notify group with appropriate reason ──
        const reason = usedAtAll && !tagsProtected
            ? `avoir utilisé @all/@tous pour mentionner tout le groupe`
            : `avoir tenté de mentionner le Maître ou un Sudo`;

        await sock.sendMessage(chatId, {
            text: `🎩 @${senderId.split('@')[0]} a été expulsé de la Maison VALENHART pour ${reason}.\n\n> _"On ne dérange pas la Maison VALENHART impunément — même les administrateurs ne sont pas épargnés."_ — Alfred 🎩`,
            mentions: [senderId]
        });

    } catch (err) {
        console.error('Antitag detection error:', err.message);
    }
}

// ─── Admin command: .antitag on/off ──────────────────────────────────────────
async function handleAntitagCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '🎩 Cette commande est réservée aux administrateurs, Monsieur.'
            }, { quoted: message });
            return;
        }

        const arg = userMessage.slice('.antitag'.length).trim().toLowerCase();

        if (!arg || arg === 'help') {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Protection Anti-Tag*\n\n` +
                      `*.antitag on* — Activer la protection\n` +
                      `*.antitag off* — Désactiver\n\n` +
                      `🛡️ *Protections actives :*\n` +
                      `• Mention du Maître ou d'un Sudo → expulsion\n` +
                      `• Utilisation de *@all* / *@tous* (WhatsApp) → expulsion\n\n` +
                      `⚠️ *Aucune exception :* Admins compris.\n\n` +
                      `> _"On ne dérange pas la Maison VALENHART impunément."_ 🎩`
            }, { quoted: message });
            return;
        }

        if (arg === 'on') {
            await setAntitag(chatId, 'on', 'kick');
            await sock.sendMessage(chatId, {
                text: `🎩 *Anti-Tag activé, Monsieur.* ✅\n> _Quiconque tentera de mentionner le Maître ou un Sudo sera expulsé — admins compris._ 🎩`
            }, { quoted: message });

        } else if (arg === 'off') {
            await removeAntitag(chatId);
            await sock.sendMessage(chatId, {
                text: `🎩 *Anti-Tag désactivé, Monsieur.* ❌`
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 Commande invalide. Tapez *.antitag on* ou *.antitag off*`
            }, { quoted: message });
        }

    } catch (err) {
        console.error('Antitag command error:', err.message);
    }
}

module.exports = { handleAntitagCommand, handleTagDetection };
