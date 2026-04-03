const fetch = require('node-fetch');
const { channelInfo } = require('../lib/messageConfig');

async function simpCommand(sock, chatId, quotedMsg, mentionedJid, sender) {
    try {
        // quotedMsg is raw contextInfo.quotedMessage — extract sender from contextInfo
        const ctxInfo = quotedMsg; // passed as contextInfo in some calls
        let who;
        if (mentionedJid && mentionedJid[0]) who = mentionedJid[0];
        else if (quotedMsg) who = sender; // fallback to sender if quoted but no mention
        else who = sender;

        let avatarUrl;
        try { avatarUrl = await sock.profilePictureUrl(who, 'image'); }
        catch { avatarUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'; }

        const apiUrl = `https://some-random-api.com/canvas/misc/simpcard?avatar=${encodeURIComponent(avatarUrl)}`;
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`API error: ${response.status}`);

        const imageBuffer = Buffer.from(await response.arrayBuffer());
        await sock.sendMessage(chatId, {
            image: imageBuffer,
            caption: `🎩 _Alfred présente ce certificat officiel, sans autre commentaire._ — @${who.split('@')[0]}`,
            mentions: [who], ...channelInfo
        });
    } catch (error) {
        console.error('Error in simp command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Alfred n\'a pu générer ce document, Monsieur. Veuillez réessayer.' });
    }
}

module.exports = simpCommand;
