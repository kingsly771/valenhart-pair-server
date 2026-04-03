const fetch = require('node-fetch');
const { channelInfo } = require('../lib/messageConfig');

async function piesCommand(sock, chatId, message, args) {
    const quotedMsg = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const mentionedJid = message?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const sender = message?.key?.participant || message?.key?.remoteJid;
    try {
        let who = quotedMsg ? quotedMsg.sender : (mentionedJid && mentionedJid[0]) ? mentionedJid[0] : sender;

        let avatarUrl;
        try { avatarUrl = await sock.profilePictureUrl(who, 'image'); }
        catch { avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; }

        const apiUrl = `https://some-random-api.com/canvas/misc/pies?avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎩 _Alfred vous présente cette composition artistique, Monsieur._ 🥧\n— @${who.split('@')[0]}`,
            mentions: [who], ...channelInfo
        });
    } catch (error) {
        console.error('Error in pies command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu générer cette illustration, Monsieur. Veuillez réessayer.' });
    }
}

async function piesAlias(sock, chatId, message, country) {
    return piesCommand(sock, chatId, null, [country], message.key.participant || message.key.remoteJid);
}
module.exports = { piesCommand, piesAlias };
