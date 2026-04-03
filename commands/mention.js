const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

function loadState() {
    try {
        const raw = fs.readFileSync(path.join(__dirname, '..', 'data', 'mention.json'), 'utf8');
        const state = JSON.parse(raw);
        if (state?.assetPath?.endsWith('assets/mention_default.webp')) return { enabled: !!state.enabled, assetPath: '', type: 'text' };
        return state;
    } catch { return { enabled: false, assetPath: '', type: 'text' }; }
}

function saveState(state) {
    fs.writeFileSync(path.join(__dirname, '..', 'data', 'mention.json'), JSON.stringify(state, null, 2));
}

async function handleMentionDetection(sock, chatId, message) {
    try {
        if (message.key?.fromMe) return;
        const state = loadState();
        if (!state.enabled) return;

        const rawId = sock.user?.id || '';
        const botNum = rawId.split('@')[0].split(':')[0];
        const botJids = [`${botNum}@s.whatsapp.net`, `${botNum}@whatsapp.net`, rawId];

        const msg = message.message || {};
        const contexts = [
            msg.extendedTextMessage?.contextInfo, msg.imageMessage?.contextInfo,
            msg.videoMessage?.contextInfo, msg.stickerMessage?.contextInfo
        ].filter(Boolean);

        let mentioned = [];
        for (const c of contexts) if (Array.isArray(c.mentionedJid)) mentioned = mentioned.concat(c.mentionedJid);
        if (!mentioned.length) return;

        const isBotMentioned = mentioned.some(j => botJids.includes(j));
        if (!isBotMentioned) return;

        if (!state.assetPath) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred à votre service, Monsieur.*\n\n> _"Vous m'avez appelé — me voici."_ 🫡`
            }, { quoted: message });
            return;
        }

        const assetPath = path.join(__dirname, '..', state.assetPath);
        if (!fs.existsSync(assetPath)) {
            await sock.sendMessage(chatId, { text: '🎩 *Alfred à votre service, Monsieur.* 🫡' }, { quoted: message });
            return;
        }

        const payload = {};
        if (state.type === 'sticker') payload.sticker = fs.readFileSync(assetPath);
        else if (state.type === 'image') payload.image = fs.readFileSync(assetPath);
        else if (state.type === 'video') { payload.video = fs.readFileSync(assetPath); if (state.gifPlayback) payload.gifPlayback = true; }
        else if (state.type === 'audio') { payload.audio = fs.readFileSync(assetPath); payload.mimetype = state.mimetype || 'audio/mpeg'; if (typeof state.ptt === 'boolean') payload.ptt = state.ptt; }
        else payload.text = '🎩 Alfred à votre service. 🫡';

        await sock.sendMessage(chatId, payload, { quoted: message });
    } catch (err) { console.error('handleMentionDetection error:', err); }
}

async function mentionToggleCommand(sock, chatId, message, args, isOwner) {
    if (!isOwner) return sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison, Monsieur.' }, { quoted: message });
    const onoff = (args || '').trim().toLowerCase();
    if (!['on', 'off'].includes(onoff)) return sock.sendMessage(chatId, { text: '🎩 Veuillez préciser *on* ou *off*, Monsieur. Exemple : *.mention on*' }, { quoted: message });
    const state = loadState();
    state.enabled = onoff === 'on';
    saveState(state);
    return sock.sendMessage(chatId, {
        text: `🎩 La détection de mention est désormais *${state.enabled ? 'activée ✅' : 'désactivée ❌'}*, Monsieur.\n> _Alfred veille sur chaque appel à son nom._ 🎩`
    }, { quoted: message });
}

async function setMentionCommand(sock, chatId, message, isOwner) {
    if (!isOwner) return sock.sendMessage(chatId, { text: '🎩 Cette commande est réservée au Maître de la Maison, Monsieur.' }, { quoted: message });
    const ctx = message.message?.extendedTextMessage?.contextInfo;
    const qMsg = ctx?.quotedMessage;
    if (!qMsg) return sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez répondre à un message ou média (sticker/image/vidéo/audio).' }, { quoted: message });

    let type = 'sticker', buf, dataType;
    if (qMsg.stickerMessage) { dataType = 'stickerMessage'; type = 'sticker'; }
    else if (qMsg.imageMessage) { dataType = 'imageMessage'; type = 'image'; }
    else if (qMsg.videoMessage) { dataType = 'videoMessage'; type = 'video'; }
    else if (qMsg.audioMessage) { dataType = 'audioMessage'; type = 'audio'; }
    else if (qMsg.conversation || qMsg.extendedTextMessage?.text) { type = 'text'; }
    else return sock.sendMessage(chatId, { text: '🎩 Format non supporté, Monsieur. Utilisez texte, sticker, image, vidéo ou audio.' }, { quoted: message });

    if (type === 'text') {
        buf = Buffer.from(qMsg.conversation || qMsg.extendedTextMessage?.text || '', 'utf8');
    } else {
        try {
            const media = qMsg[dataType];
            const kind = type === 'sticker' ? 'sticker' : type;
            const stream = await downloadContentFromMessage(media, kind);
            const chunks = [];
            for await (const chunk of stream) chunks.push(chunk);
            buf = Buffer.concat(chunks);
        } catch (e) { return sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu télécharger ce fichier, Monsieur. Veuillez réessayer.' }, { quoted: message }); }
    }

    if (buf.length > 1024 * 1024) return sock.sendMessage(chatId, { text: '🎩 Le fichier est trop volumineux, Monsieur. Maximum 1 MB.' }, { quoted: message });

    let mimetype = qMsg[dataType]?.mimetype || '';
    let ext = type === 'sticker' ? 'webp' : type === 'image' ? (mimetype.includes('png') ? 'png' : 'jpg') : type === 'video' ? 'mp4' : type === 'audio' ? 'mp3' : 'txt';

    const assetsDir = path.join(__dirname, '..', 'assets');
    try {
        fs.readdirSync(assetsDir).filter(f => f.startsWith('mention_custom.')).forEach(f => { try { fs.unlinkSync(path.join(assetsDir, f)); } catch {} });
    } catch {}

    const outPath = path.join(assetsDir, `mention_custom.${ext}`);
    try { fs.writeFileSync(outPath, buf); } catch { return sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu enregistrer ce fichier, Monsieur.' }, { quoted: message }); }

    const state = loadState();
    state.assetPath = path.join('assets', `mention_custom.${ext}`);
    state.type = type;
    if (type === 'audio') state.mimetype = mimetype;
    saveState(state);

    return sock.sendMessage(chatId, {
        text: `🎩 *Parfait, Monsieur.* La réponse de mention d'Alfred a été mise à jour avec ce ${type}.\n> _Alfred répondra avec élégance à chaque appel._ ✨`
    }, { quoted: message });
}

module.exports = { handleMentionDetection, mentionToggleCommand, setMentionCommand };
