// ─── Broadcast Command ────────────────────────────────────────────────────────
// All broadcast types get full Alfred/VALENHART styling.
// Only owner/sudo can use this command.

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');
const settings = require('../settings');

function extractLink(text) {
    const match = text.match(/https?:\/\/[^\s]+/i) || text.match(/(chat\.whatsapp\.com\/[^\s]+)/i);
    return match ? match[0] : null;
}

function isWhatsAppLink(link) {
    return /chat\.whatsapp\.com\//i.test(link);
}

// ── Styled invite (WhatsApp link detected) ────────────────────────────────────
function buildInviteMessage(link, extraText) {
    const caption = extraText && extraText !== link ? extraText.replace(link, '').trim() : '';
    return (
        `╔═══════════════════════════╗\n` +
        `║   🎩 *MAISON VALENHART*   ║\n` +
        `║   _Invitation Officielle_ ║\n` +
        `╚═══════════════════════════╝\n\n` +
        `Monsieur, Madame,\n\n` +
        `Alfred, majordome de la *Maison VALENHART*, a l'honneur de vous convier à rejoindre notre cercle d'excellence.\n\n` +
        `*✨ Pourquoi nous rejoindre ?*\n\n` +
        `🏰 *Communauté d'élite* — Un espace raffiné où chaque membre est traité avec dignité et respect.\n` +
        `🎭 *Divertissement de qualité* — Jeux, défis, humour et bien plus, orchestrés par Alfred lui-même.\n` +
        `🤝 *Entraide & partage* — Une famille soudée, prête à s'entraider en toutes circonstances.\n` +
        `👑 *Modération irréprochable* — Un groupe bien tenu, sans désordre ni impolitesse.\n` +
        `🎁 *Surprises exclusives* — Des annonces, cadeaux et événements réservés aux membres.\n\n` +
        (caption ? `📌 *Message du Maître :*\n_"${caption}"_\n\n` : '') +
        `┌─────────────────────────┐\n` +
        `│  🔗 *Rejoindre la Maison* │\n` +
        `│  ${link}\n` +
        `└─────────────────────────┘\n\n` +
        `> _"La Maison VALENHART vous attend, les bras ouverts. Alfred se fera un honneur de vous accueillir."_\n\n` +
        `— *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `📢 *Notre canal :* https://whatsapp.com/channel/0029Vb7fv0ICnA7yZU6SdZ0K`
    );
}

// ── Styled text announcement ──────────────────────────────────────────────────
function buildTextMessage(text) {
    return (
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  📢 *MAISON VALENHART*   ┃\n` +
        `┃   _Annonce Officielle_   ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n` +
        `${text}\n\n` +
        `╰─────────────────────────────\n` +
        `  — *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `  📢 *Notre canal :* https://whatsapp.com/channel/0029Vb7fv0ICnA7yZU6SdZ0K`
    );
}

// ── Styled image/video caption ────────────────────────────────────────────────
function buildMediaCaption(caption) {
    const header =
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓\n` +
        `┃  📢 *MAISON VALENHART*   ┃\n` +
        `┃   _Annonce Officielle_   ┃\n` +
        `┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛\n\n`;

    const footer =
        `\n\n╰─────────────────────────────\n` +
        `  — *Alfred* 🎩 | _${settings.botOwner}_\n\n` +
        `  📢 *Notre canal :* https://whatsapp.com/channel/0029Vb7fv0ICnA7yZU6SdZ0K`;

    return header + (caption || '') + footer;
}

async function handleBroadcast(sock, chatId, message, rawText) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '🎩 Cette commande est réservée au Maître de la Maison VALENHART, Monsieur.'
            }, { quoted: message });
            return;
        }

        const allChats = await sock.groupFetchAllParticipating();
        const groupIds = Object.keys(allChats);

        if (groupIds.length === 0) {
            await sock.sendMessage(chatId, {
                text: '🎩 Je ne suis membre d\'aucun groupe pour le moment, Monsieur.'
            }, { quoted: message });
            return;
        }

        const broadcastText = rawText.replace(/^\.broadcast\s*/i, '').trim();
        const hasImage = !!(message.message?.imageMessage);
        const hasVideo = !!(message.message?.videoMessage);

        // Show help
        if (!broadcastText && !hasImage && !hasVideo) {
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Diffusion Générale*\n\n` +
                    `📝 *.broadcast <message>* — Annonce stylée\n` +
                    `🔗 *.broadcast <lien>* — Invitation honorable\n` +
                    `📸 *.broadcast [légende]* + image — Image avec style\n` +
                    `🎬 *.broadcast [légende]* + vidéo — Vidéo avec style\n\n` +
                    `> _"Un seul mot du Maître, et toute la Maison VALENHART est informée."_ 🎩`
            }, { quoted: message });
            return;
        }

        // Download media ONCE before loop
        let mediaBuffer = null;
        if (hasImage || hasVideo) {
            try {
                mediaBuffer = await downloadMediaMessage(
                    message, 'buffer', {},
                    { logger: undefined, reuploadRequest: sock.updateMediaMessage }
                );
            } catch (dlErr) {
                await sock.sendMessage(chatId, {
                    text: `🎩 Impossible de télécharger le média, Monsieur : ${dlErr.message}`
                }, { quoted: message });
                return;
            }
        }

        // Build final styled message
        const detectedLink = broadcastText ? extractLink(broadcastText) : null;
        let finalText = '';

        if (hasImage || hasVideo) {
            // For media: build styled caption
            finalText = buildMediaCaption(broadcastText);
        } else if (detectedLink && isWhatsAppLink(detectedLink)) {
            // WhatsApp invite link
            finalText = buildInviteMessage(detectedLink, broadcastText);
        } else {
            // Plain text announcement
            finalText = buildTextMessage(broadcastText);
        }

        // Confirmation
        await sock.sendMessage(chatId, {
            text: `🎩 Diffusion en cours vers *${groupIds.length} groupe(s)*...\n> _"Très bien, Monsieur. Je transmets votre message à l'instant."_ 🎩`
        }, { quoted: message });

        let successCount = 0;
        let failCount = 0;

        for (const groupId of groupIds) {
            try {
                if (hasImage && mediaBuffer) {
                    await sock.sendMessage(groupId, {
                        image: mediaBuffer,
                        caption: finalText
                    });
                } else if (hasVideo && mediaBuffer) {
                    await sock.sendMessage(groupId, {
                        video: mediaBuffer,
                        caption: finalText
                    });
                } else {
                    await sock.sendMessage(groupId, {
                        text: finalText
                    });
                }

                successCount++;
                await new Promise(r => setTimeout(r, 1500));

            } catch (err) {
                console.error(`Broadcast fail for ${groupId}:`, err.message);
                failCount++;
            }
        }

        await sock.sendMessage(chatId, {
            text:
                `🎩 *Diffusion terminée, Monsieur.*\n\n` +
                `✅ Envoyé : *${successCount}* groupe(s)\n` +
                `❌ Échec  : *${failCount}* groupe(s)\n\n` +
                `> _"Votre message a été transmis à travers toute la Maison VALENHART."_ 🎩`
        }, { quoted: message });

    } catch (err) {
        console.error('Broadcast error:', err.message);
        await sock.sendMessage(chatId, {
            text: `🎩 Une erreur est survenue lors de la diffusion, Monsieur : ${err.message}`
        }, { quoted: message });
    }
}

module.exports = { handleBroadcast };
