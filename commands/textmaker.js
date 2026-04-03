const axios = require('axios');

// ─── Supported styles ─────────────────────────────────────────────────────────
const STYLES = {
    fire: 'fire', neon: 'neon', matrix: 'matrix', glitch: 'glitch',
    ice: 'ice', snow: 'snow', metallic: 'metallic', devil: 'devil',
    purple: 'purple', thunder: 'thunder', hacker: 'hacker', arena: 'arena',
    sand: 'sand', leaves: 'leaves', '1917': '1917', light: 'light',
    impressive: 'impressive', blackpink: 'blackpink'
};

// ─── API chain — try each until one works ────────────────────────────────────
async function fetchTextImage(style, text) {
    const encoded = encodeURIComponent(text);

    const apis = [
        // 1 — xteam
        async () => {
            const r = await axios.get(
                `https://api.xteam.xyz/textmaker/${style}?text=${encoded}&apikey=d90a9e986e18778b`,
                { responseType: 'arraybuffer', timeout: 12000 }
            );
            if (!r.data || r.data.byteLength < 500) throw new Error('empty');
            return Buffer.from(r.data);
        },
        // 2 — bk9
        async () => {
            const r = await axios.get(
                `https://bk9.fun/textmaker/${style}?text=${encoded}`,
                { responseType: 'arraybuffer', timeout: 12000 }
            );
            if (!r.data || r.data.byteLength < 500) throw new Error('empty');
            return Buffer.from(r.data);
        },
        // 3 — siputzx
        async () => {
            const r = await axios.get(
                `https://api.siputzx.my.id/api/textpro/${style}?text=${encoded}`,
                { responseType: 'arraybuffer', timeout: 12000 }
            );
            if (!r.data || r.data.byteLength < 500) throw new Error('empty');
            return Buffer.from(r.data);
        },
        // 4 — lolhuman
        async () => {
            const r = await axios.get(
                `https://api.lolhuman.xyz/api/textpro/${style}?apikey=lolhuman&text=${encoded}`,
                { responseType: 'arraybuffer', timeout: 12000 }
            );
            if (!r.data || r.data.byteLength < 500) throw new Error('empty');
            return Buffer.from(r.data);
        },
        // 5 — betabotz
        async () => {
            const r = await axios.get(
                `https://api.betabotz.eu.org/api/tools/text2art?text=${encoded}&style=${style}`,
                { responseType: 'arraybuffer', timeout: 12000 }
            );
            if (!r.data || r.data.byteLength < 500) throw new Error('empty');
            return Buffer.from(r.data);
        },
    ];

    for (const fn of apis) {
        try { return await fn(); } catch {}
    }
    return null;
}

// ─── Main command ─────────────────────────────────────────────────────────────
async function textmakerCommand(sock, chatId, message, style, text) {
    // Normalize style
    style = (style || '').toLowerCase();
    if (!STYLES[style]) style = 'fire';

    if (!text || !text.trim()) {
        const styleList = Object.keys(STYLES).map(s => `*.${s}*`).join(' • ');
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Atelier Calligraphique*\n\n` +
                  `📌 *Usage :* *.${style} <votre texte>*\n\n` +
                  `🎨 *Styles disponibles :*\n${styleList}\n\n` +
                  `> _"La Maison VALENHART habille vos mots avec élégance."_ — Alfred 📜`
        }, { quoted: message });
        return;
    }

    text = text.trim();

    try {
        // Thinking reaction
        await sock.sendMessage(chatId, { react: { text: '🎨', key: message.key } });

        const imgBuffer = await fetchTextImage(style, text);

        if (!imgBuffer) {
            await sock.sendMessage(chatId, {
                text: `🎩 L'atelier calligraphique est momentanément indisponible, Monsieur.\n> _Veuillez réessayer dans un instant._ 🕯️`
            }, { quoted: message });
            return;
        }

        await sock.sendMessage(chatId, {
            image: imgBuffer,
            caption: `🎩 *Style :* ${style.toUpperCase()}\n✏️ _"${text}"_\n\n> _L'atelier calligraphique de la Maison VALENHART._ ✨`
        }, { quoted: message });

    } catch (err) {
        console.error('Textmaker error:', err.message);
        await sock.sendMessage(chatId, {
            text: `🎩 L'atelier calligraphique rencontre un contretemps, Monsieur. Veuillez réessayer.`
        }, { quoted: message }).catch(() => {});
    }
}

module.exports = { textmakerCommand, STYLES };
