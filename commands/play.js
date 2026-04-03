const axios = require('axios');

// ─── Multiple search APIs (fallback chain) ────────────────────────────────────
async function searchYT(query) {
    const apis = [
        // API 1 — apis-keith
        async () => {
            const r = await axios.get(
                `https://apis-keith.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );
            const t = r.data?.result?.[0] || r.data?.data?.[0] || r.data?.[0];
            if (!t?.url) throw new Error('no result');
            return { url: t.url, title: t.title || query, thumbnail: t.thumbnail || t.image || '' };
        },
        // API 2 — yt-search via popcat
        async () => {
            const r = await axios.get(
                `https://api.popcat.xyz/yt-search?q=${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );
            const t = r.data;
            if (!t?.url) throw new Error('no result');
            return { url: t.url, title: t.title || query, thumbnail: t.thumbnail || '' };
        },
        // API 3 — okatsu
        async () => {
            const r = await axios.get(
                `https://okatsu-rolezapiiz.vercel.app/search/youtube?q=${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );
            const t = r.data?.result?.[0] || r.data?.data?.[0];
            if (!t?.url) throw new Error('no result');
            return { url: t.url, title: t.title || query, thumbnail: t.thumbnail || '' };
        },
    ];

    for (const fn of apis) {
        try { return await fn(); } catch {}
    }
    return null;
}

// ─── Multiple download APIs (fallback chain) ──────────────────────────────────
async function downloadMP3(ytUrl) {
    const apis = [
        // API 1 — David Cyril (primary)
        async () => {
            const r = await axios.get(
                `https://apis.davidcyril.name.ng/download/ytmp3?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 20000 }
            );
            const url = r.data?.result?.download_url || r.data?.result?.url;
            if (!url) throw new Error('no url');
            return url;
        },
        // API 2 — apis-keith dlmp3
        async () => {
            const r = await axios.get(
                `https://apis-keith.vercel.app/download/dlmp3?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 20000 }
            );
            const url = r.data?.result?.downloadUrl || r.data?.result?.url || r.data?.download;
            if (!url) throw new Error('no url');
            return url;
        },
        // API 3 — okatsu dlmp3
        async () => {
            const r = await axios.get(
                `https://okatsu-rolezapiiz.vercel.app/download/ytmp3?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 20000 }
            );
            const url = r.data?.result?.downloadUrl || r.data?.data?.url || r.data?.url;
            if (!url) throw new Error('no url');
            return url;
        },
        // API 3 — yt-download-api
        async () => {
            const r = await axios.get(
                `https://yt-download.org/api/button/mp3?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 20000 }
            );
            const url = r.data?.url || r.data?.downloadUrl;
            if (!url) throw new Error('no url');
            return url;
        },
        // API 4 — cobalt-like
        async () => {
            const r = await axios.post(
                'https://api.cobalt.tools/api/json',
                { url: ytUrl, vCodec: 'h264', vQuality: '720', aFormat: 'mp3', isAudioOnly: true },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 20000 }
            );
            const url = r.data?.url;
            if (!url) throw new Error('no url');
            return url;
        },
    ];

    for (const fn of apis) {
        try { return await fn(); } catch {}
    }
    return null;
}

// ─── Main play command ────────────────────────────────────────────────────────
async function playCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation
            || message.message?.extendedTextMessage?.text
            || message.message?.imageMessage?.caption
            || '';
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Service Musical*\n\n` +
                      `Monsieur, quelle œuvre souhaitez-vous ?\n\n` +
                      `📌 *.play <titre ou artiste>*\n` +
                      `📌 *.song <titre>*\n` +
                      `📌 *.mp3 <titre>*\n\n` +
                      `> _"La musique est l'âme des grandes demeures."_ 🎵`
            }, { quoted: message });
        }

        // Step 1 — Search
        const searching = await sock.sendMessage(chatId, {
            text: `🎩 *Alfred cherche dans les archives...*\n🔍 _"${searchQuery}"_`
        }, { quoted: message });

        const track = await searchYT(searchQuery);

        if (!track) {
            return await sock.sendMessage(chatId, {
                text: `🎩 Alfred n'a trouvé aucun résultat pour *"${searchQuery}"*, Monsieur.\n> _Essayez un autre titre ou artiste._`
            }, { quoted: message });
        }

        // Step 2 — Download
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred prépare la musique, Monsieur...*\n🎵 _"${track.title}"_\n\n> _Un instant de patience, je vous prie._ 🕯️`
        }, { quoted: message });

        const downloadUrl = await downloadMP3(track.url);

        if (!downloadUrl) {
            return await sock.sendMessage(chatId, {
                text: `🎩 *Alfred a trouvé la piste mais ne peut la télécharger, Monsieur.*\n\n🎵 *${track.title}*\n🔗 ${track.url}\n\n> _Copiez le lien pour l'écouter directement._ 🎩`
            }, { quoted: message });
        }

        // Step 3 — Send
        await sock.sendMessage(chatId, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: `${track.title.replace(/[^a-zA-Z0-9 ]/g, '')}.mp3`,
            contextInfo: {
                externalAdReply: {
                    title: track.title,
                    body: `🎩 Alfred — Maison VALENHART`,
                    thumbnailUrl: track.thumbnail || '',
                    sourceUrl: track.url,
                    mediaType: 1
                }
            }
        }, { quoted: message });

    } catch (error) {
        console.error('Error in play:', error.message);
        await sock.sendMessage(chatId, {
            text: `🎩 Alfred est au regret, Monsieur — le service musical rencontre un contretemps.\n> _Veuillez réessayer dans un moment._ 🕯️`
        }, { quoted: message }).catch(() => {});
    }
}

module.exports = playCommand;
