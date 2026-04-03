// ─── gstatus Command ──────────────────────────────────────────────────────────
// Post a WhatsApp status/story (text, image, or video) to status@broadcast.
// ".gstatus reply ..." also quotes a cited story in the new status post.

const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const isOwnerOrSudo = require('../lib/isOwner');

async function gstatusCommand(sock, chatId, message, args) {
    try {
        const senderId = message.key.participant || message.key.remoteJid;
        const isOwner = message.key.fromMe || await isOwnerOrSudo(senderId, sock, chatId);

        if (!isOwner) {
            await sock.sendMessage(chatId, {
                text: '🎩 Seul le Maître de la Maison VALENHART peut publier des statuts, Monsieur.'
            }, { quoted: message });
            return;
        }

        // args is already lowercased from main.js — use rawText for the actual caption
        const rawText =
            message.message?.conversation?.trim() ||
            message.message?.extendedTextMessage?.text?.trim() ||
            message.message?.imageMessage?.caption?.trim() ||
            message.message?.videoMessage?.caption?.trim() || '';

        // Strip the command prefix to get caption
        const rawArgs = rawText.replace(/^\.gstatus\s*/i, '').trim();
        const isReplyMode = rawArgs.toLowerCase().startsWith('reply');
        const captionText = isReplyMode ? rawArgs.slice(5).trim() : rawArgs;

        // ── Detect media on this message ──────────────────────────────────────
        const hasImage = !!(message.message?.imageMessage);
        const hasVideo = !!(message.message?.videoMessage);

        // ── Detect quoted status context (for reply mode) ──────────────────────
        const quotedCtx =
            message.message?.extendedTextMessage?.contextInfo ||
            message.message?.imageMessage?.contextInfo ||
            message.message?.videoMessage?.contextInfo || null;

        const quotedMsg         = quotedCtx?.quotedMessage   || null;
        const quotedStanzaId    = quotedCtx?.stanzaId        || null;
        const quotedParticipant = quotedCtx?.participant      || null;

        // ── Show help ─────────────────────────────────────────────────────────
        if (!captionText && !hasImage && !hasVideo) {
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Publication de Statut*\n\n` +
                    `📝 *.gstatus <texte>* — Statut texte\n` +
                    `📸 *.gstatus [légende]* + image — Statut image\n` +
                    `🎬 *.gstatus [légende]* + vidéo — Statut vidéo\n\n` +
                    `↩️ *Répondre à un statut existant :*\n` +
                    `Citez un statut puis :\n` +
                    `💬 *.gstatus reply <texte>*\n` +
                    `📸 *.gstatus reply* + image\n` +
                    `🎬 *.gstatus reply* + vidéo\n\n` +
                    `> _"La Maison VALENHART diffuse vos histoires avec élégance, Monsieur."_ 🎩`
            }, { quoted: message });
            return;
        }

        // ── Reply mode needs a quoted status ──────────────────────────────────
        if (isReplyMode && (!quotedMsg || !quotedStanzaId)) {
            await sock.sendMessage(chatId, {
                text:
                    `🎩 Monsieur, pour publier en réponse à un statut :\n\n` +
                    `1️⃣ Ouvrez WhatsApp → Statuts\n` +
                    `2️⃣ Appuyez longuement sur le statut → Répondre\n` +
                    `3️⃣ Tapez *.gstatus reply <texte>* (ou joignez image/vidéo)\n\n` +
                    `> _"Alfred attendra votre statut à citer, Monsieur."_ 🎩`
            }, { quoted: message });
            return;
        }

        // ── Build reply contextInfo if needed ─────────────────────────────────
        const statusPayloadBase = isReplyMode && quotedMsg ? {
            contextInfo: {
                stanzaId:      quotedStanzaId,
                participant:   quotedParticipant || '',
                quotedMessage: quotedMsg,
                remoteJid:     'status@broadcast'
            }
        } : {};

        const replyTag = isReplyMode ? ' ↩️' : '';

        // ── POST: image status ────────────────────────────────────────────────
        if (hasImage) {
            const buffer = await downloadMediaMessage(
                message, 'buffer', {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );
            await sock.sendMessage('status@broadcast', {
                image: buffer,
                caption: captionText || '',
                backgroundColor: '#1a1a2e',
                font: 3,
                ...statusPayloadBase
            });
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Statut Publié*${replyTag}\n\n` +
                    `📸 Image publiée en statut avec succès.\n` +
                    (captionText ? `💬 Légende : _"${captionText}"_\n` : '') +
                    (isReplyMode ? `↩️ En réponse à un statut\n` : '') +
                    `\n> _"Votre histoire est visible de tous, Monsieur."_ 🎩`
            }, { quoted: message });

        // ── POST: video status ────────────────────────────────────────────────
        } else if (hasVideo) {
            const buffer = await downloadMediaMessage(
                message, 'buffer', {},
                { logger: undefined, reuploadRequest: sock.updateMediaMessage }
            );
            await sock.sendMessage('status@broadcast', {
                video: buffer,
                caption: captionText || '',
                backgroundColor: '#1a1a2e',
                ...statusPayloadBase
            });
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Statut Publié*${replyTag}\n\n` +
                    `🎬 Vidéo publiée en statut avec succès.\n` +
                    (captionText ? `💬 Légende : _"${captionText}"_\n` : '') +
                    (isReplyMode ? `↩️ En réponse à un statut\n` : '') +
                    `\n> _"Votre histoire est visible de tous, Monsieur."_ 🎩`
            }, { quoted: message });

        // ── POST: text status ─────────────────────────────────────────────────
        } else {
            const formattedStatus =
                `🎩 *Maison VALENHART*\n\n${captionText}\n\n— _Alfred_ 🎩`;

            await sock.sendMessage('status@broadcast', {
                text: formattedStatus,
                backgroundColor: '#1a1a2e',
                font: 3,
                ...statusPayloadBase
            });
            await sock.sendMessage(chatId, {
                text:
                    `🎩 *Alfred — Statut Publié*${replyTag}\n\n` +
                    `📝 Statut texte publié :\n_"${captionText}"_\n` +
                    (isReplyMode ? `↩️ En réponse à un statut\n` : '') +
                    `\n> _"Votre histoire est visible de tous, Monsieur."_ 🎩`
            }, { quoted: message });
        }

    } catch (error) {
        console.error('gstatus error:', error.message);
        await sock.sendMessage(chatId, {
            text: `🎩 Erreur lors de la publication du statut, Monsieur : ${error.message}`
        }, { quoted: message });
    }
}

module.exports = { gstatusCommand };
