const axios = require('axios');

async function igsCommand(sock, chatId, message, username) {
    if (!username) {
        await sock.sendMessage(chatId, {
            text: `🎩 *Alfred — Archives Instagram*\n\nMonsieur, veuillez me préciser le nom de compte Instagram.\n\n📌 *Exemple :* *.igs cristiano*\n\n> _"Alfred consulte les archives visuelles avec discrétion."_ 🕵️`
        }, { quoted: message });
        return;
    }

    try {
        await sock.sendMessage(chatId, { text: `🎩 *Alfred consulte le profil Instagram, Monsieur...*\n🔍 _@${username}_` }, { quoted: message });

        const response = await axios.get(`https://api.xteam.xyz/instagram/user?username=${username}&apikey=d90a9e986e18778b`);
        const data = response.data?.result;

        if (!data) throw new Error('No data');

        await sock.sendMessage(chatId, {
            image: { url: data.profile_pic_url_hd || data.profile_pic_url },
            caption: `🎩 *Alfred vous présente ce profil Instagram, Monsieur :*\n\n` +
                     `👤 *Nom :* ${data.full_name || 'N/A'}\n` +
                     `🔖 *Username :* @${data.username}\n` +
                     `📝 *Biographie :* ${data.biography || 'Aucune'}\n` +
                     `👥 *Abonnés :* ${(data.follower_count || 0).toLocaleString()}\n` +
                     `👣 *Abonnements :* ${(data.following_count || 0).toLocaleString()}\n` +
                     `📸 *Posts :* ${(data.media_count || 0).toLocaleString()}\n` +
                     `✅ *Vérifié :* ${data.is_verified ? 'Oui' : 'Non'}\n\n` +
                     `> _"Archives Instagram de la Maison VALENHART."_ 🎩`
        }, { quoted: message });
    } catch (error) {
        console.error('Error in igs command:', error);
        await sock.sendMessage(chatId, { text: `🎩 Alfred n'a pu accéder au profil *@${username}*, Monsieur. Vérifiez le nom d'utilisateur.` }, { quoted: message });
    }
}

module.exports = igsCommand;
