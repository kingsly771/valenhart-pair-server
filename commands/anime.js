const axios = require('axios');

// ─── Full action registry ─────────────────────────────────────────────────────
// source: nekos.best/api/v2 confirmed endpoints + fallback APIs
const ANIME_ACTIONS = {
    // ── Affectionate ──
    hug:       { fr: 'fait un câlin à',        emoji: '🤗', api: 'nekos' },
    kiss:      { fr: 'embrasse',               emoji: '💋', api: 'nekos' },
    pat:       { fr: 'caresse',                emoji: '🥰', api: 'nekos' },
    cuddle:    { fr: 'serre dans ses bras',    emoji: '💞', api: 'nekos' },
    handhold:  { fr: 'tient la main de',       emoji: '🤝', api: 'nekos' },
    feed:      { fr: 'nourrit',                emoji: '🍡', api: 'nekos' },
    bite:      { fr: 'mord',                   emoji: '😬', api: 'nekos' },
    lick:      { fr: 'lèche',                  emoji: '👅', api: 'nekos' },
    tickle:    { fr: 'chatouille',             emoji: '🤭', api: 'nekos' },
    // ── Playful ──
    poke:      { fr: 'taquine',                emoji: '👉', api: 'nekos' },
    nom:       { fr: 'croque',                 emoji: '😋', api: 'nekos' },
    wave:      { fr: 'salue',                  emoji: '👋', api: 'nekos' },
    wink:      { fr: 'fait un clin d\'œil à', emoji: '😉', api: 'nekos' },
    highfive:  { fr: 'tape dans la main de',   emoji: '🙌', api: 'nekos' },
    yeet:      { fr: 'projette',               emoji: '🚀', api: 'nekos' },
    bully:     { fr: 'embête',                 emoji: '😈', api: 'nekos' },
    hold:      { fr: 'retient',                emoji: '🫂', api: 'nekos' },
    // ── Emotions ──
    cry:       { fr: 'pleure',                 emoji: '😢', api: 'nekos' },
    blush:     { fr: 'rougit',                 emoji: '😊', api: 'nekos' },
    smile:     { fr: 'sourit à',              emoji: '😄', api: 'nekos' },
    happy:     { fr: 'est heureux avec',       emoji: '😄', api: 'nekos' },
    pout:      { fr: 'boude',                  emoji: '😤', api: 'nekos' },
    shrug:     { fr: 'hausse les épaules',     emoji: '🤷', api: 'nekos' },
    think:     { fr: 'réfléchit',              emoji: '🤔', api: 'nekos' },
    facepalm:  { fr: 'fait un facepalm',       emoji: '🤦', api: 'nekos' },
    // ── Actions ──
    dance:     { fr: 'danse avec',             emoji: '💃', api: 'nekos' },
    run:       { fr: 'court',                  emoji: '🏃', api: 'nekos' },
    sleep:     { fr: 'dort',                   emoji: '😴', api: 'nekos' },
    nod:       { fr: 'approuve',               emoji: '👍', api: 'nekos' },
    thumbsup:  { fr: 'approuve',               emoji: '👍', api: 'nekos' },
    lurk:      { fr: 'observe discrètement',   emoji: '👀', api: 'nekos' },
    // ── Combat / Alfred style ──
    slap:      { fr: 'gifle',                  emoji: '👋', api: 'nekos' },
    punch:     { fr: 'frappe',                 emoji: '👊', api: 'nekos' },
    kick:      { fr: 'donne un coup de pied à',emoji: '🦵', api: 'nekos' },
    kill:      { fr: 'élimine',                emoji: '💀', api: 'nekos' },
    shoot:     { fr: 'tire sur',               emoji: '🔫', api: 'nekos' },
    stab:      { fr: 'poignarde',              emoji: '🗡️', api: 'nekos' },
};

// ─── Fetch GIF from nekos.best with fallback ──────────────────────────────────
async function fetchGif(action) {
    // Primary: nekos.best
    try {
        const r = await axios.get(`https://nekos.best/api/v2/${action}`, { timeout: 8000 });
        const url = r.data?.results?.[0]?.url;
        if (url) return url;
    } catch {}

    // Fallback 1: otakugifs.xyz
    try {
        const r = await axios.get(`https://api.otakugifs.xyz/gif?reaction=${action}`, { timeout: 8000 });
        const url = r.data?.url;
        if (url) return url;
    } catch {}

    // Fallback 2: nekos.life (select actions)
    try {
        const r = await axios.get(`https://nekos.life/api/v2/img/${action}`, { timeout: 8000 });
        const url = r.data?.url;
        if (url) return url;
    } catch {}

    // Fallback 3: waifu.pics
    try {
        const category = action === 'kill' ? 'kill' : action === 'slap' ? 'slap' :
                         action === 'pat' ? 'pat' : action === 'hug' ? 'hug' :
                         action === 'kiss' ? 'kiss' : action === 'cry' ? 'cry' :
                         action === 'punch' ? 'punch' : action === 'dance' ? 'dance' :
                         action === 'smile' ? 'smile' : action === 'wave' ? 'wave' : null;
        if (category) {
            const r = await axios.post(`https://api.waifu.pics/sfw/${category}`, {}, { timeout: 8000 });
            const url = r.data?.url;
            if (url) return url;
        }
    } catch {}

    return null;
}

// ─── Main anime command ───────────────────────────────────────────────────────
async function animeCommand(sock, chatId, message, action, mentionedJids) {
    try {
        // Accept array ['hug'] or string 'hug'
        if (Array.isArray(action)) {
            mentionedJids = mentionedJids ||
                message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            action = action[0];
        }

        // Normalize
        if (!action) action = '';
        action = action.toLowerCase().replace(/[^a-z]/g, '');

        // Aliases
        if (action === 'faceplam' || action === 'facepam') action = 'facepalm';
        if (action === 'highfives') action = 'highfive';

        const act = ANIME_ACTIONS[action];

        if (!act) {
            const grouped = {
                '🤗 Affection': ['hug','kiss','pat','cuddle','handhold','feed','bite','lick','tickle'],
                '🎭 Playful':   ['poke','nom','wave','wink','highfive','yeet','bully'],
                '😢 Emotions':  ['cry','blush','smile','happy','pout','shrug','think','facepalm'],
                '💃 Actions':   ['dance','run','sleep','nod','thumbsup','lurk'],
                '👊 Combat':    ['slap','punch','kick','kill','shoot','stab'],
            };
            const listText = Object.entries(grouped)
                .map(([cat, cmds]) => `${cat} : ${cmds.map(c => `*.${c}*`).join(', ')}`)
                .join('\n');
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Galerie des Réactions Anime*\n\n${listText}\n\n` +
                      `📌 *Exemple :* *.hug @personne*\n\n` +
                      `> _"La Maison VALENHART s'anime avec élégance."_ 🎩`
            }, { quoted: message });
            return;
        }

        // Get mentions
        if (!mentionedJids || mentionedJids.length === 0) {
            mentionedJids = message.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        }

        const sender = message.key.participant || message.key.remoteJid;
        const senderTag = `@${sender.split('@')[0]}`;

        // Build caption
        let caption;
        if (mentionedJids.length > 0) {
            const targets = mentionedJids.map(j => `@${j.split('@')[0]}`).join(', ');
            caption = `🎩 ${senderTag} ${act.emoji} *${act.fr}* ${targets}\n\n> _Maison VALENHART — Alfred._ ✨`;
        } else {
            caption = `🎩 ${senderTag} ${act.emoji} *${act.fr}*\n\n> _Alfred capte ce moment pour la Maison VALENHART._ ✨`;
        }

        // Fetch GIF
        const gifUrl = await fetchGif(action);

        if (!gifUrl) {
            await sock.sendMessage(chatId, {
                text: caption + `\n\n> _Alfred n'a pu trouver d'animation pour cette réaction. 🕯️_`
            }, { quoted: message });
            return;
        }

        // Send as GIF
        await sock.sendMessage(chatId, {
            video: { url: gifUrl },
            gifPlayback: true,
            caption,
            mentions: [sender, ...mentionedJids]
        }, { quoted: message });

    } catch (error) {
        console.error('Error in anime command:', error.message);
        await sock.sendMessage(chatId, {
            text: '🎩 La galerie anime rencontre un contretemps, Monsieur. Veuillez réessayer.'
        }, { quoted: message }).catch(() => {});
    }
}

module.exports = { animeCommand, ANIME_ACTIONS };
