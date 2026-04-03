const axios = require('axios');
const { channelInfo } = require('../lib/messageConfig');

async function characterCommand(sock, chatId, message) {
    let userToAnalyze;
    if (message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length > 0) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.mentionedJid[0];
    } else if (message.message?.extendedTextMessage?.contextInfo?.participant) {
        userToAnalyze = message.message.extendedTextMessage.contextInfo.participant;
    }

    if (!userToAnalyze) {
        await sock.sendMessage(chatId, {
            text: '🎩 Monsieur, veuillez désigner la personne dont vous souhaitez que j\'analyse le caractère.', ...channelInfo
        }, { quoted: message });
        return;
    }

    try {
        let profilePic;
        try { profilePic = await sock.profilePictureUrl(userToAnalyze, 'image'); }
        catch { profilePic = 'https://i.imgur.com/2wzGhpF.jpeg'; }

        const response = await axios.get(`https://some-random-api.com/canvas/misc/namecard?avatar=${encodeURIComponent(profilePic)}`, { responseType: 'arraybuffer' });

        await sock.sendMessage(chatId, {
            image: Buffer.from(response.data),
            caption: `🎩 *Alfred présente le caractère de @${userToAnalyze.split('@')[0]}, Monsieur :*\n\n> _"Chaque individu est un mystère digne d'être étudié."_ — Alfred 📜`,
            mentions: [userToAnalyze], ...channelInfo
        }, { quoted: message });
    } catch (error) {
        console.error('Error in character command:', error);
        await sock.sendMessage(chatId, { text: '🎩 L\'analyse de caractère a rencontré un contretemps, Monsieur. Mes excuses.' }, { quoted: message });
    }
}

module.exports = characterCommand;
