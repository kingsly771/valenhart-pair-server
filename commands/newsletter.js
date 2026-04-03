// ─── Newsletter Command ───────────────────────────────────────────────────────
// .newsletter  → bot follows the channel + sends styled invite to all groups
//
// Uses Baileys newsletterMetadata() to resolve the JID once at first call,
// then newsletterFollow() so the bot itself follows the channel,
// and sends a styled invite message to every group.

const isOwnerOrSudo = require('../lib/isOwner');
const settings = require('../settings');

const CHANNEL_LINK        = settings.newsletterLink;
const CHANNEL_INVITE_CODE = settings.newsletterInviteCode;

// Cache the resolved newsletter JID so we only fetch it once per session
let cachedNewsletterJid = null;

async function resolveNewsletterJid(sock) {
    if (cachedNewsletterJid) return cachedNewsletterJid;
    try {
        const meta = await sock.newsletterMetadata('invite', CHANNEL_INVITE_CODE);
        cachedNewsletterJid = meta?.id || null;
        return cachedNewsletterJid;
    } catch (err) {
        console.error('newsletterMetadata error:', err.message);
        return null;
    }
}

function buildNewsletterMessage(channelName, channelDesc, subscribers) {
    const subLine = subscribers ? `👥 *${subscribers.toLocaleString()} abonnés*\n\n` : '';
    const descLine = channelDesc ? `📝 _${channelDesc}_\n\n` : '';

    return (
        `╔═══════════════════════════════╗\n` +
        `║  📰  *MAISON VALENHART*       ║\n` +
        `║  _Newsletter Officielle_ 🎩  ║\n` +
        `╚═══════════════════════════════╝\n\n` +
        `Monsieur, Madame,\n\n` +
        `Alfred, majordome de la *Maison VALENHART*, a l'honneur de vous présenter notre *Canal Officiel${channelName ? ` — ${channelName}` : ''}* — votre source exclusive d'informations, d'annonces et de contenus de prestige.\n\n` +
        subLine +
        descLine +
        `*✨ Pourquoi rejoindre notre canal ?*\n\n` +
        `📣 *Annonces exclusives* — Soyez le premier informé des nouvelles de la Maison VALENHART.\n` +
        `🎭 *Contenus de qualité* — Articles, conseils et divertissements soigneusement sélectionnés.\n` +
        `👑 *Accès VIP* — Informations réservées aux abonnés du canal.\n` +
        `🔔 *Mises à jour en temps réel* — Ne manquez aucune annonce importante.\n` +
        `🎁 *Surprises & événements* — Offres spéciales pour nos fidèles abonnés.\n\n` +
        `┌──────────────────────────────┐\n` +
        `│  🔗 *Rejoindre le Canal*     │\n` +
        `│  ${CHANNEL_LINK}\n` +
        `└──────────────────────────────┘\n\n` +
        `> _"La Maison VALENHART vous invite à rejoindre son cercle d'excellence._\n` +
        `> _Alfred se fera un honneur de vous y accueillir."_\n\n` +
        `— *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `📢 *Notre canal :* ${CHANNEL_LINK}`
    );
}

async function newsletterCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.'
            }, { quoted: message });
            return;
        }

        // ── Step 1: Resolve newsletter JID & fetch metadata ───────────────────
        let channelName = 'VALENHART MD';
        let channelDesc = '';
        let subscribers = null;
        let newsletterJid = null;

        try {
            const meta = await sock.newsletterMetadata('invite', CHANNEL_INVITE_CODE);
            newsletterJid    = meta?.id            || null;
            channelName      = meta?.name          || channelName;
            channelDesc      = meta?.description   || '';
            subscribers      = meta?.subscribers   || meta?.subscriberCount || null;
            cachedNewsletterJid = newsletterJid;
        } catch (metaErr) {
            console.error('Could not fetch newsletter metadata:', metaErr.message);
        }

        // ── Step 2: Bot follows the channel ───────────────────────────────────
        if (newsletterJid) {
            try {
                await sock.newsletterFollow(newsletterJid);
                console.log('✅ Bot now follows newsletter:', newsletterJid);
            } catch (followErr) {
                console.error('newsletterFollow error:', followErr.message);
                // Not fatal — continue with broadcast
            }
        }

        // ── Step 3: Get all groups ────────────────────────────────────────────
        const allChats = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allChats);

        if (groupIds.length === 0) {
            await sock.sendMessage(chatId, {
                text: '🎩 Je ne suis membre d\'aucun groupe pour le moment, Monsieur.'
            }, { quoted: message });
            return;
        }

        const newsletterText = buildNewsletterMessage(channelName, channelDesc, subscribers);

        // Confirmation
        await sock.sendMessage(chatId, {
            text:
                `🎩 Newsletter en cours d'envoi vers *${groupIds.length} groupe(s)*...\n` +
                (newsletterJid ? `✅ Canal suivi par Alfred.\n` : '') +
                `> _"Alfred diffuse votre newsletter avec élégance, Monsieur."_ 🎩`
        }, { quoted: message });

        let successCount = 0;
        let failCount = 0;

        for (const groupId of groupIds) {
            try {
                await sock.sendMessage(groupId, { text: newsletterText });
                successCount++;
                await new Promise(r => setTimeout(r, 1500));
            } catch (err) {
                console.error(`Newsletter fail for ${groupId}:`, err.message);
                failCount++;
            }
        }

        await sock.sendMessage(chatId, {
            text:
                `🎩 *Newsletter envoyée, Monsieur.*\n\n` +
                `✅ Envoyé : *${successCount}* groupe(s)\n` +
                `❌ Échec  : *${failCount}* groupe(s)\n\n` +
                `> _"Votre newsletter a été diffusée à travers toute la Maison VALENHART."_ 🎩`
        }, { quoted: message });

    } catch (err) {
        console.error('Newsletter error:', err.message);
        await sock.sendMessage(chatId, {
            text: `🎩 Une erreur est survenue lors de l'envoi de la newsletter, Monsieur : ${err.message}`
        }, { quoted: message });
    }
}

// ── Called once at bot startup to follow the channel silently ─────────────────
async function initNewsletter(sock) {
    try {
        const meta = await sock.newsletterMetadata('invite', CHANNEL_INVITE_CODE);
        if (meta?.id) {
            cachedNewsletterJid = meta.id;
            await sock.newsletterFollow(meta.id);
            console.log('🎩 Alfred suit le canal VALENHART:', meta.id);
        }
    } catch (err) {
        console.error('initNewsletter error:', err.message);
    }
}


// ── .newsletterjid — show the resolved channel JID ───────────────────────────
async function newsletterJidCommand(sock, chatId, message) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);
        if (!isOwner) return;

        await sock.sendMessage(chatId, {
            text: `🎩 Résolution du JID du canal...`
        }, { quoted: message });

        try {
            const meta = await sock.newsletterMetadata('invite', CHANNEL_INVITE_CODE);
            cachedNewsletterJid = meta?.id || null;
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Canal VALENHART*\n\n` +
                    `📰 *Nom :* ${meta?.name || 'N/A'}\n` +
                    `🔑 *JID :* \`${meta?.id || 'N/A'}\`\n` +
                    `👥 *Abonnés :* ${meta?.subscribers || meta?.subscriberCount || 'N/A'}\n` +
                    `🔗 *Lien :* ${CHANNEL_LINK}\n\n` +
                    `> _"JID résolu et mis en cache, Monsieur."_ 🎩`
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(chatId, {
                text: `🎩 Impossible de résoudre le JID, Monsieur : ${err.message}`
            }, { quoted: message });
        }
    } catch (err) {
        console.error('newsletterJidCommand error:', err.message);
    }
}

module.exports = { newsletterCommand, initNewsletter, newsletterJidCommand };
