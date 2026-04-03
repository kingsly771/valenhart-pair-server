const fetch = require('node-fetch');

async function githubCommand(sock, chatId, message, username) {
    try {
        if (!username) {
            await sock.sendMessage(chatId, {
                text: `🎩 *Alfred — Archives GitHub*\n\nMonsieur, veuillez préciser le nom d'utilisateur GitHub.\n\n📌 *Exemple :* *.github torvalds*\n\n> _"Alfred consulte les archives numériques avec rigueur."_ 💻`
            }, { quoted: message });
            return;
        }

        const res = await fetch(`https://api.github.com/users/${username}`);
        if (!res.ok) throw new Error('User not found');
        const data = await res.json();

        const text =
            `🎩 *Alfred vous présente ce profil GitHub, Monsieur :*\n` +
            `${'─'.repeat(32)}\n\n` +
            `👤 *Nom :* ${data.name || 'N/A'}\n` +
            `🔖 *Login :* @${data.login}\n` +
            `🌐 *Profil :* ${data.html_url}\n` +
            `👥 *Abonnés :* ${data.followers}\n` +
            `📦 *Dépôts publics :* ${data.public_repos}\n` +
            `🏢 *Organisation :* ${data.company || 'N/A'}\n` +
            `📍 *Localisation :* ${data.location || 'N/A'}\n` +
            `📜 *Bio :* ${data.bio || 'Aucune biographie renseignée.'}\n\n` +
            `> _"Alfred — Archives numériques de la Maison VALENHART."_ 🎩`;

        await sock.sendMessage(chatId, {
            image: { url: data.avatar_url },
            caption: text
        }, { quoted: message });
    } catch (error) {
        console.error('Error in github command:', error);
        await sock.sendMessage(chatId, { text: '🎩 Les archives GitHub sont momentanément inaccessibles, Monsieur. Vérifiez le nom d\'utilisateur.' }, { quoted: message });
    }
}

module.exports = githubCommand;
