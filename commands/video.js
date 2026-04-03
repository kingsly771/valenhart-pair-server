const axios = require('axios');

// ─── Multiple search APIs (fallback chain) ────────────────────────────────────
async function searchYT(query) {
    const apis = [
        async () => {
            const r = await axios.get(
                `https://apis-keith.vercel.app/search/ytsearch?q=${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );
            const t = r.data?.result?.[0] || r.data?.data?.[0] || r.data?.[0];
            if (!t?.url) throw new Error('no result');
            return { url: t.url, title: t.title || query, thumbnail: t.thumbnail || '' };
        },
        async () => {
            const r = await axios.get(
                `https://api.popcat.xyz/yt-search?q=${encodeURIComponent(query)}`,
                { timeout: 8000 }
            );
            const t = r.data;
            if (!t?.url) throw new Error('no result');
            return { url: t.url, title: t.title || query, thumbnail: t.thumbnail || '' };
        },
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

// ─── Multiple video download APIs (fallback chain) ────────────────────────────
async function downloadMP4(ytUrl) {
    const apis = [
        // David Cyril (primary)
        async () => {
            const r = await axios.get(
                `https://apis.davidcyril.name.ng/download/ytmp4?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 25000 }
            );
            const url = r.data?.result?.video_url || r.data?.result?.url;
            if (!url) throw new Error('no url');
            return url;
        },
        async () => {
            const r = await axios.get(
                `https://apis-keith.vercel.app/download/dlmp4?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 25000 }
            );
            const url = r.data?.result?.downloadUrl || r.data?.result?.url || r.data?.download;
            if (!url) throw new Error('no url');
            return url;
        },
        async () => {
            const r = await axios.get(
                `https://okatsu-rolezapiiz.vercel.app/download/ytmp4?url=${encodeURIComponent(ytUrl)}`,
                { timeout: 25000 }
            );
            const url = r.data?.result?.downloadUrl || r.data?.data?.url || r.data?.url;
            if (!url) throw new Error('no url');
            return url;
        },
        async () => {
            const r = await axios.post(
                'https://api.cobalt.tools/api/json',
                { url: ytUrl, vCodec: 'h264', vQuality: '720', aFormat: 'mp3', isAudioOnly: false },
                { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 25000 }
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

// ─── Main video command ───────────────────────────────────────────────────────
async function videoCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation
            || message.message?.extendedTextMessage?.text
            || '';
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Service Vidéo*\n\n` +
                      `Monsieur, quelle vidéo souhaitez-vous ?\n\n` +
                      `📌 *.video <titre ou artiste>*\n` +
                      `📌 *.ytmp4 <titre>*\n\n` +
                      `> _"Alfred met la vidéothèque à votre disposition."_ 🎬`
            }, { quoted: message });
        }

        // Step 1 — Search
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred cherche la vidéo...*\n🔍 _"${searchQuery}"_`
        }, { quoted: message });

        const track = await searchYT(searchQuery);

        if (!track) {
            return await sock.sendMessage(chatId, {
                text: `🎩 Aucun résultat pour *"${searchQuery}"*, Monsieur.\n> _Essayez un autre titre ou artiste._`
            }, { quoted: message });
        }

        // Step 2 — Download
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred prépare la vidéo, Monsieur...*\n🎬 _"${track.title}"_\n\n> _Un instant de patience._ 🕯️`
        }, { quoted: message });

        const downloadUrl = await downloadMP4(track.url);

        if (!downloadUrl) {
            return await sock.sendMessage(chatId, {
                text: `🎩 *Alfred a trouvé la vidéo mais ne peut la télécharger, Monsieur.*\n\n🎬 *${track.title}*\n🔗 ${track.url}\n\n> _Copiez le lien pour la visionner directement._ 🎩`
            }, { quoted: message });
        }

        // Step 3 — Send
        await sock.sendMessage(chatId, {
            video: { url: downloadUrl },
            caption: `🎩 *${track.title}*\n\n> _Mis à disposition par Alfred — Maison VALENHART._ 🎬`,
            fileName: `${track.title.replace(/[^a-zA-Z0-9 ]/g, '')}.mp4`
        }, { quoted: message });

    } catch (error) {
        console.error('Error in video:', error.message);
        await sock.sendMessage(chatId, {
            text: `🎩 Alfred est au regret, Monsieur — le service vidéo rencontre un contretemps.\n> _Veuillez réessayer dans un moment._ 🕯️`
        }, { quoted: message }).catch(() => {});
    }
}

module.exports = videoCommand;
