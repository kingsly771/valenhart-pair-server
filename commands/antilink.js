const { setAntilink, getAntilink, removeAntilink } = require('../lib/index');

function containsURL(str) {
    if (!str || typeof str !== 'string') return false;
    return /(https?:\/\/|wa\.me|chat\.whatsapp\.com|bit\.ly|t\.me|youtu\.be|tiktok\.com|instagram\.com\/|fb\.com)[\S]*/i.test(str);
}

// ─── Runtime link detection — fires on every group message ───────────────────
async function handleLinkDetection(sock, chatId, message, senderId) {
    try {
        if (!chatId.endsWith('@g.us')) return;
        if (message.key.fromMe) return;

        const config = await getAntilink(chatId, 'on');
        if (!config || !config.enabled) return;

        // ── NO EXEMPTIONS — admins and sudo are NOT spared ──

        const text = message.message?.conversation
            || message.message?.extendedTextMessage?.text
            || message.message?.imageMessage?.caption
            || message.message?.videoMessage?.caption
            || message.message?.documentMessage?.caption
            || '';

        if (!containsURL(text)) return;

        const action = config.action || 'kick';

        // Always delete the message first
        try { await sock.sendMessage(chatId, { delete: message.key }); } catch {}

        if (action === 'kick') {
            // Delete + kick
            try { await sock.groupParticipantsUpdate(chatId, [senderId], 'remove'); } catch {}
            await sock.sendMessage(chatId, {
                text: `🎩 @${senderId.split('@')[0]} a été expulsé de la Maison VALENHART pour envoi de lien non autorisé.\n\n> _"Alfred ne tolère aucune intrusion numérique — même les administrateurs ne sont pas épargnés."_ 🕯️`,
                mentions: [senderId]
            });

        } else if (action === 'delete') {
            // Delete only — no kick
            await sock.sendMessage(chatId, {
                text: `🎩 @${senderId.split('@')[0]}, les liens ne sont pas autorisés dans ce groupe, Monsieur.\n\n> _"Votre message a été supprimé par Alfred."_ 🕯️`,
                mentions: [senderId]
            });
        }

    } catch (err) {
        console.error('Antilink error:', err.message);
    }
}

// ─── Admin command: .antilink on / delete / off ───────────────────────────────
async function handleAntilinkCommand(sock, chatId, userMessage, senderId, isSenderAdmin, message) {
    try {
        if (!isSenderAdmin) {
            await sock.sendMessage(chatId, {
                text: '🎩 Cette commande est réservée aux administrateurs, Monsieur.'
            }, { quoted: message });
            return;
        }

        const arg = userMessage.slice('.antilink'.length).trim().toLowerCase();

        if (!arg || arg === 'help') {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Protection Anti-Liens*\n\n` +
                      `*.antilink on* — Activer (suppression + expulsion)\n` +
                      `*.antilink delete* — Activer (suppression uniquement, sans expulsion)\n` +
                      `*.antilink off* — Désactiver\n\n` +
                      `⚠️ *Aucune exception :* Admins et sudo sont concernés.\n\n` +
                      `> _"Alfred surveille chaque lien, Monsieur."_ 🎩`
            }, { quoted: message });
            return;
        }

        if (arg === 'on') {
            await setAntilink(chatId, 'on', 'kick');
            await sock.sendMessage(chatId, {
                text: `🎩 *Anti-Liens activé (expulsion), Monsieur.* ✅\n> _Tout lien sera supprimé et l'expéditeur expulsé — admins compris._ 🎩`
            }, { quoted: message });

        } else if (arg === 'delete') {
            await setAntilink(chatId, 'on', 'delete');
            await sock.sendMessage(chatId, {
                text: `🎩 *Anti-Liens activé (suppression uniquement), Monsieur.* ✅\n> _Tout lien sera supprimé sans expulsion — admins compris._ 🎩`
            }, { quoted: message });

        } else if (arg === 'off') {
            await removeAntilink(chatId);
            await sock.sendMessage(chatId, {
                text: `🎩 *Anti-Liens désactivé, Monsieur.* ❌`
            }, { quoted: message });

        } else {
            await sock.sendMessage(chatId, {
                text: `🎩 Commande invalide. Tapez *.antilink on*, *.antilink delete* ou *.antilink off*`
            }, { quoted: message });
        }

    } catch (err) {
        console.error('Antilink command error:', err.message);
    }
}

module.exports = { handleAntilinkCommand, handleLinkDetection };
