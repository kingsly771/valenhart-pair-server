const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

async function wastedCommand(sock, chatId, message) {
    let userToWaste;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToWaste = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToWaste = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToWaste) {
        await sock.sendMessage(chatId, { text: '🎩 Monsieur, veuillez désigner la personne à qui destiner cette... illustration.', ...channelInfo }, { quoted: message });
        return;
    }

    try {
        let profilePic;
        try { profilePic = await sock.profilePictureUrl(userToWaste, 'image'); }
        catch { profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; }

        const response = await axios.get(`https://some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(profilePic)}`, { responseType: 'arraybuffer' });
        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 _Alfred présente ce tableau mémorable, sans commentaire particulier._ — @${userToWaste.split('@')[0]}`,
            mentions: [userToWaste], ...channelInfo
        }, { quoted: message });
    } catch (error) {
        console.error('Error in wasted command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Cette illustration ne peut être générée pour l\'instant, Monsieur. Mes excuses.', ...channelInfo }, { quoted: message });
    }
}

module.exports = wastedCommand;
