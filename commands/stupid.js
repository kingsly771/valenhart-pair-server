const fetch = require('node-fetch');

async function stupidCommand(sock, chatId, quotedMsg, mentionedJid, sender, args) {
    try {
        let who = quotedMsg ? quotedMsg.sender : (mentionedJid && mentionedJid[0]) ? mentionedJid[0] : sender;
        let text = args && args.length > 0 ? args.join(' ') : 'im+stupid';

        let avatarUrl;
        try { avatarUrl = await sock.profilePictureUrl(who, 'image'); }
        catch { avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; }

        const apiUrl = `https://some-random-api.com/canvas/misc/its-so-stupid?avatar=${encodeURIComponent(avatarUrl)}&dog=${encodeURIComponent(text)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎩 _Alfred ne commentera pas davantage, Monsieur. L'image parle d'elle-même._ — @${who.split('@')[0]}`,
            mentions: [who]
        });
    } catch (error) {
        console.error('Error in stupid command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Je suis au regret, Monsieur — cette illustration n\'a pu être générée. Veuillez réessayer.' });
    }
}

module.exports = { stupidCommand };
